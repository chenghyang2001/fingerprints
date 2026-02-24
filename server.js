const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// 生成數學 CAPTCHA
function generateMathCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    let answer;
    switch (operator) {
        case '+': answer = num1 + num2; break;
        case '-': answer = Math.abs(num1 - num2); break; // 確保結果為正數
        case '*': answer = num1 * num2; break;
    }

    return {
        question: `${num1} ${operator} ${num2} = ?`,
        answer: answer
    };
}

// 驗證數學 CAPTCHA
function verifyMathCaptcha(sessionAnswer, userAnswer) {
    return parseInt(sessionAnswer) === parseInt(userAnswer);
}

// 中間件
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'fingerprint-session-secret-key-2025',
    resave: true,           // 在 Render 環境中啟用 resave
    saveUninitialized: true, // 在 Render 環境中啟用 saveUninitialized
    cookie: {
        secure: false,      // Render 環境中暫時禁用 secure
        httpOnly: true,     // 防止 XSS 攻擊
        maxAge: 24 * 60 * 60 * 1000, // 1 天
        sameSite: 'lax'     // CSRF 保護
    },
    name: 'fingerprint.sid'
}));
app.use(express.static('public'));

// 資料庫初始化
const db = new sqlite3.Database('fingerprints.db');

db.serialize(() => {
    // 多重指紋資料表
    db.run(`
        CREATE TABLE IF NOT EXISTS fingerprints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id TEXT UNIQUE,
            confidence_score REAL,
            confidence_comment TEXT,
            version TEXT,
            components TEXT,
            client_id TEXT,
            custom_fingerprint TEXT,
            canvas_fingerprint TEXT,
            webgl_fingerprint TEXT,
            audio_fingerprint TEXT,
            fonts_fingerprint TEXT,
            plugins_fingerprint TEXT,
            hardware_fingerprint TEXT,
            collection_time INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            linked_user_id INTEGER,
            FOREIGN KEY (linked_user_id) REFERENCES accounts(id)
        )
    `);

    // 用戶帳號資料表
    db.run(`
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `);
});

// 計算多重指紋相似度
function calculateMultiFingerprintSimilarity(oldData, newData) {
    // 各指紋類型的定義：[取舊值的方式, 取新值的方式, 計算函式, 權重]
    const fingerprintTypes = [
        {
            key: 'components',
            hasOld: () => !!oldData.components,
            hasNew: () => !!newData.components,
            calc: () => calculateFingerprintJSSimilarity(oldData.components, newData.components),
            weight: 0.4,
            label: 'FingerprintJS'
        },
        {
            key: 'canvas',
            hasOld: () => !!oldData.canvas && oldData.canvas !== '',
            hasNew: () => !!newData.canvas && newData.canvas !== '',
            calc: () => calculateCanvasSimilarity(oldData.canvas, newData.canvas),
            weight: 0.2,
            label: 'Canvas'
        },
        {
            key: 'webgl',
            hasOld: () => oldData.webgl && Object.keys(oldData.webgl).length > 0,
            hasNew: () => newData.webgl && Object.keys(newData.webgl).length > 0,
            calc: () => calculateWebGLSimilarity(oldData.webgl, newData.webgl),
            weight: 0.15,
            label: 'WebGL'
        },
        {
            key: 'audio',
            hasOld: () => oldData.audio && Object.keys(oldData.audio).length > 0,
            hasNew: () => newData.audio && Object.keys(newData.audio).length > 0,
            calc: () => calculateAudioSimilarity(oldData.audio, newData.audio),
            weight: 0.1,
            label: 'Audio'
        },
        {
            key: 'fonts',
            hasOld: () => oldData.fonts && Object.keys(oldData.fonts).length > 0,
            hasNew: () => newData.fonts && Object.keys(newData.fonts).length > 0,
            calc: () => calculateFontsSimilarity(oldData.fonts, newData.fonts),
            weight: 0.1,
            label: 'Fonts'
        },
        {
            key: 'hardware',
            hasOld: () => oldData.hardware && Object.keys(oldData.hardware).length > 0,
            hasNew: () => newData.hardware && Object.keys(newData.hardware).length > 0,
            calc: () => calculateHardwareSimilarity(oldData.hardware, newData.hardware),
            weight: 0.05,
            label: 'Hardware'
        },
        {
            key: 'custom',
            hasOld: () => oldData.custom && Object.keys(oldData.custom).length > 0,
            hasNew: () => newData.custom && Object.keys(newData.custom).length > 0,
            calc: () => calculateCustomSimilarity(oldData.custom, newData.custom),
            weight: 0.05,
            label: 'Custom'
        }
    ];

    const available = fingerprintTypes.filter(t => t.hasOld() && t.hasNew());

    if (available.length === 0) {
        return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const type of available) {
        const similarity = type.calc();
        console.log(`${type.label} 相似度:`, similarity);
        weightedSum += similarity * type.weight;
        totalWeight += type.weight;
    }

    const finalSimilarity = Math.round((weightedSum / totalWeight) * 10) / 10;

    console.log('相似度計算調試:', {
        availableTypes: available.length,
        weightedSum,
        totalWeight,
        finalSimilarity
    });

    return Math.min(100, Math.max(0, finalSimilarity));
}

// 計算 FingerprintJS V4 相似度
function calculateFingerprintJSSimilarity(oldComponents, newComponents) {
    const oldKeys = Object.keys(oldComponents);
    const newKeys = Object.keys(newComponents);

    if (oldKeys.length === 0 || newKeys.length === 0) {
        return 0;
    }

    // 重要的指紋元件（權重較高）
    const importantComponents = [
        'canvas', 'webgl', 'audio', 'fonts', 'screenResolution',
        'hardwareConcurrency', 'deviceMemory', 'platform'
    ];

    // 容易變化的元件（給予部分分數）
    const volatileComponents = ['viewport', 'timezone'];

    // 瀏覽器重啟後會變化的元件（完全忽略）
    const sessionBasedComponents = ['domBlockers', 'sessionStorage', 'localStorage', 'indexedDB'];

    const allKeys = new Set([...oldKeys, ...newKeys]);

    let totalComponents = 0;
    let matchingComponents = 0;
    let importantMatches = 0;
    let importantTotal = 0;

    for (const key of allKeys) {
        const oldValue = oldComponents[key];
        const newValue = newComponents[key];

        // 跳過錯誤元件和 session 相關元件
        if ((oldValue && oldValue.error) || (newValue && newValue.error) || sessionBasedComponents.includes(key)) {
            continue;
        }

        totalComponents++;
        const isImportant = importantComponents.includes(key);
        const isVolatile = volatileComponents.includes(key);

        if (isImportant) {
            importantTotal++;
        }

        if (oldValue && newValue) {
            const oldVal = JSON.stringify(oldValue.value);
            const newVal = JSON.stringify(newValue.value);

            if (oldVal === newVal) {
                matchingComponents++;
                if (isImportant) {
                    importantMatches++;
                }
            } else if (isVolatile) {
                matchingComponents += 0.5;
            }
        }
    }

    if (totalComponents === 0) {
        return 0;
    }

    const basicSimilarity = (matchingComponents / totalComponents) * 100;
    const importantSimilarity = importantTotal > 0 ? (importantMatches / importantTotal) * 100 : 100;

    // 重要元件權重 70%，一般元件權重 30%
    const finalSimilarity = (importantSimilarity * 0.7) + (basicSimilarity * 0.3);

    return Math.round(finalSimilarity * 10) / 10;
}

// 計算 Canvas 相似度
function calculateCanvasSimilarity(oldCanvas, newCanvas) {
    return oldCanvas === newCanvas ? 100 : 0;
}

// 計算 WebGL 相似度
function calculateWebGLSimilarity(oldWebGL, newWebGL) {
    if (!oldWebGL || !newWebGL) return 0;

    let matches = 0;

    if (oldWebGL.renderer === newWebGL.renderer) matches++;
    if (oldWebGL.vendor === newWebGL.vendor) matches++;
    if (oldWebGL.version === newWebGL.version) matches++;

    const extensionSimilarity = calculateArraySimilarity(
        oldWebGL.extensions || [],
        newWebGL.extensions || []
    );

    // 基本資訊佔 3/3.5，擴展佔 0.5/3.5
    return ((matches + extensionSimilarity * 0.5) / 3.5) * 100;
}

// 計算音訊相似度
function calculateAudioSimilarity(oldAudio, newAudio) {
    if (!oldAudio || !newAudio) return 0;

    if (oldAudio.fingerprint === newAudio.fingerprint) return 100;
    if (oldAudio.sampleRate === newAudio.sampleRate) return 50; // 部分匹配

    return 0;
}

// 計算字體相似度
function calculateFontsSimilarity(oldFonts, newFonts) {
    if (!oldFonts || !newFonts) return 0;
    return calculateArraySimilarity(oldFonts.available || [], newFonts.available || []);
}

// 計算硬體相似度
function calculateHardwareSimilarity(oldHardware, newHardware) {
    if (!oldHardware || !newHardware) return 0;

    let matches = 0;
    if (oldHardware.cores === newHardware.cores) matches++;
    if (oldHardware.memory === newHardware.memory) matches++;
    if (oldHardware.touchPoints === newHardware.touchPoints) matches++;

    return (matches / 3) * 100;
}

// 計算自定義指紋相似度
function calculateCustomSimilarity(oldCustom, newCustom) {
    if (!oldCustom || !newCustom) return 0;

    let matches = 0;
    let total = 0;

    if (oldCustom.screen && newCustom.screen) {
        if (oldCustom.screen.width === newCustom.screen.width) matches++;
        if (oldCustom.screen.height === newCustom.screen.height) matches++;
        if (oldCustom.screen.colorDepth === newCustom.screen.colorDepth) matches++;
        total += 3;
    }

    if (oldCustom.timezone === newCustom.timezone) matches++;
    total++;

    return total > 0 ? (matches / total) * 100 : 0;
}

// 計算陣列相似度（Jaccard 相似度）
function calculateArraySimilarity(oldArray, newArray) {
    if (!Array.isArray(oldArray) || !Array.isArray(newArray)) return 0;

    const oldSet = new Set(oldArray);
    const newSet = new Set(newArray);

    const intersection = new Set([...oldSet].filter(x => newSet.has(x)));
    const union = new Set([...oldSet, ...newSet]);

    return union.size > 0 ? (intersection.size / union.size) * 100 : 0;
}

// 雜湊字串（djb2 演算法）
function hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString(16);
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash; // 轉換為 32 位整數
    }
    return hash.toString(16);
}

// 找出變化的元件
function findChangedComponents(oldComponents, newComponents) {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldComponents), ...Object.keys(newComponents)]);

    for (const key of allKeys) {
        const oldValue = oldComponents[key];
        const newValue = newComponents[key];

        if (!oldValue && newValue) {
            changes.push({ component: key, type: 'added', newValue: newValue.value });
        } else if (oldValue && !newValue) {
            changes.push({ component: key, type: 'removed', oldValue: oldValue.value });
        } else if (oldValue && newValue) {
            const oldVal = JSON.stringify(oldValue.value);
            const newVal = JSON.stringify(newValue.value);

            if (oldVal !== newVal) {
                changes.push({
                    component: key,
                    type: 'changed',
                    oldValue: oldValue.value,
                    newValue: newValue.value
                });
            }
        }
    }

    return changes;
}

// 中間件：驗證已登入
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: '未登入' });
    }
}

// API 路由：生成數學 CAPTCHA
app.get('/api/captcha', (req, res) => {
    try {
        const captcha = generateMathCaptcha();
        req.session.captchaAnswer = captcha.answer;

        console.log('生成 CAPTCHA:', {
            question: captcha.question,
            answer: captcha.answer,
            sessionId: req.sessionID,
            hasCaptchaAnswer: !!req.session.captchaAnswer
        });

        req.session.save((err) => {
            if (err) {
                console.error('Session 保存錯誤:', err);
                // 即使 session 保存失敗，也返回 CAPTCHA 問題
                return res.json({
                    question: captcha.question,
                    timestamp: Date.now(),
                    warning: 'Session 保存失敗，驗證可能不穩定'
                });
            }

            console.log('CAPTCHA session 保存成功');
            res.json({
                question: captcha.question,
                timestamp: Date.now()
            });
        });
    } catch (error) {
        console.error('CAPTCHA 生成錯誤:', error);
        res.status(500).json({ error: '無法生成驗證碼' });
    }
});

// API 路由：用戶註冊
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, captcha } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '請填寫所有欄位' });
    }

    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email 格式不正確' });
        }
    }

    if (!captcha) {
        return res.status(400).json({ error: '請完成驗證碼' });
    }

    console.log('註冊驗證 CAPTCHA:', {
        userInput: captcha,
        sessionCaptchaAnswer: req.session.captchaAnswer,
        sessionId: req.sessionID
    });

    if (!req.session.captchaAnswer) {
        console.log('註冊 CAPTCHA 驗證失敗：session 中沒有 captchaAnswer');
        return res.status(400).json({ error: '驗證碼已過期，請重新載入' });
    }

    if (!verifyMathCaptcha(req.session.captchaAnswer, captcha)) {
        console.log('註冊 CAPTCHA 驗證失敗：答案不匹配');
        return res.status(400).json({ error: '驗證碼錯誤，請重試' });
    }

    delete req.session.captchaAnswer;

    if (username.length < 3) {
        return res.status(400).json({ error: '使用者名稱至少需要 3 個字元' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: '密碼至少需要 6 個字元' });
    }

    try {
        db.get('SELECT id FROM accounts WHERE username = ?', [username], async (err, existingUser) => {
            if (err) {
                console.error('檢查用戶錯誤:', err);
                return res.status(500).json({ error: '系統錯誤' });
            }

            if (existingUser) {
                return res.status(400).json({ error: '使用者名稱已存在' });
            }

            if (email) {
                db.get('SELECT id FROM accounts WHERE email = ?', [email], async (emailErr, existingEmail) => {
                    if (emailErr) {
                        console.error('檢查 email 錯誤:', emailErr);
                        return res.status(500).json({ error: '系統錯誤' });
                    }

                    if (existingEmail) {
                        return res.status(400).json({ error: 'Email 已被使用' });
                    }

                    await createUser();
                });
            } else {
                await createUser();
            }

            async function createUser() {
                const hashedPassword = await bcrypt.hash(password, 10);

                db.run(
                    'INSERT INTO accounts (username, email, password_hash) VALUES (?, ?, ?)',
                    [username, email || null, hashedPassword],
                    function(insertErr) {
                        if (insertErr) {
                            console.error('建立用戶錯誤:', insertErr);
                            return res.status(500).json({ error: '註冊失敗' });
                        }

                        console.log('新用戶註冊成功:', { id: this.lastID, username, email });
                        res.json({
                            success: true,
                            message: '註冊成功！',
                            userId: this.lastID
                        });
                    }
                );
            }
        });
    } catch (error) {
        console.error('註冊錯誤:', error);
        res.status(500).json({ error: '註冊失敗' });
    }
});

// API 路由：用戶登入
app.post('/api/auth/login', async (req, res) => {
    const { username, password, captcha, rememberMe } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '請輸入使用者名稱/Email 和密碼' });
    }

    if (!captcha) {
        return res.status(400).json({ error: '請完成驗證碼' });
    }

    console.log('登入驗證 CAPTCHA:', {
        userInput: captcha,
        sessionCaptchaAnswer: req.session.captchaAnswer,
        sessionId: req.sessionID
    });

    if (!req.session.captchaAnswer) {
        console.log('登入 CAPTCHA 驗證失敗：session 中沒有 captchaAnswer');
        return res.status(400).json({ error: '驗證碼已過期，請重新載入' });
    }

    if (!verifyMathCaptcha(req.session.captchaAnswer, captcha)) {
        console.log('登入 CAPTCHA 驗證失敗：答案不匹配');
        return res.status(400).json({ error: '驗證碼錯誤，請重試' });
    }

    delete req.session.captchaAnswer;

    db.get('SELECT * FROM accounts WHERE username = ? OR email = ?', [username, username], async (err, user) => {
        if (err) {
            console.error('登入查詢錯誤:', err);
            return res.status(500).json({ error: '登入失敗' });
        }

        if (!user) {
            return res.status(401).json({ error: '使用者名稱/Email 或密碼錯誤' });
        }

        try {
            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatch) {
                return res.status(401).json({ error: '使用者名稱/Email 或密碼錯誤' });
            }

            req.session.userId = user.id;
            req.session.username = user.username;

            // 記住我功能：延長 session 有效期至 30 天
            req.session.cookie.maxAge = rememberMe
                ? 30 * 24 * 60 * 60 * 1000
                : 24 * 60 * 60 * 1000;

            db.run('UPDATE accounts SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

            console.log('用戶登入成功:', { id: user.id, username: user.username, rememberMe: !!rememberMe });

            res.json({
                success: true,
                message: '登入成功！',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            console.error('密碼驗證錯誤:', error);
            res.status(500).json({ error: '登入失敗' });
        }
    });
});

// API 路由：用戶登出
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('登出錯誤:', err);
            return res.status(500).json({ error: '登出失敗' });
        }

        res.json({ success: true, message: '登出成功！' });
    });
});

// API 路由：獲取當前用戶資訊
app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
        return res.json({ loggedIn: false });
    }

    db.get('SELECT id, username, created_at, last_login FROM accounts WHERE id = ?', [req.session.userId], (err, user) => {
        if (err || !user) {
            return res.json({ loggedIn: false });
        }

        res.json({
            loggedIn: true,
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.created_at,
                lastLogin: user.last_login
            }
        });
    });
});

// 從資料庫記錄解析多重指紋資料結構
function parseStoredFingerprint(record) {
    return {
        components: JSON.parse(record.components || '{}'),
        canvas: record.canvas_fingerprint || '',
        webgl: record.webgl_fingerprint ? JSON.parse(record.webgl_fingerprint) : {},
        audio: record.audio_fingerprint ? JSON.parse(record.audio_fingerprint) : {},
        fonts: record.fonts_fingerprint ? JSON.parse(record.fonts_fingerprint) : {},
        plugins: record.plugins_fingerprint ? JSON.parse(record.plugins_fingerprint) : {},
        hardware: record.hardware_fingerprint ? JSON.parse(record.hardware_fingerprint) : {},
        custom: record.custom_fingerprint ? JSON.parse(record.custom_fingerprint) : {}
    };
}

// 從請求主體建立新指紋資料結構
function buildNewFingerprintData(body) {
    return {
        components: body.components || {},
        canvas: body.canvas || '',
        webgl: body.webgl || {},
        audio: body.audio || {},
        fonts: body.fonts || {},
        plugins: body.plugins || {},
        hardware: body.hardware || {},
        custom: body.custom || {}
    };
}

// API 路由：處理多重指紋資料
app.post('/api/fingerprint', (req, res) => {
    const { visitorId, confidence, version, components, clientId, collectionTime } = req.body;

    if (!visitorId) {
        return res.status(400).json({ error: '缺少訪客 ID' });
    }

    console.log('收到多重指紋資料:', {
        visitorId,
        confidence: confidence?.score,
        version,
        componentsCount: Object.keys(components || {}).length,
        clientId,
        hasCustom: !!req.body.custom,
        hasCanvas: !!req.body.canvas,
        hasWebGL: !!req.body.webgl,
        hasAudio: !!req.body.audio,
        hasFonts: !!req.body.fonts,
        hasPlugins: !!req.body.plugins,
        hasHardware: !!req.body.hardware,
        collectionTime,
        isLoggedIn: !!req.session.userId,
        userId: req.session.userId
    });

    console.log('採集的元件:', Object.keys(components || {}).sort().join(', '));

    if (req.session.userId) {
        handleLoggedInUserFingerprint(req, res);
    } else {
        handleGuestUserFingerprint(req, res);
    }
});

// 處理登入用戶的指紋
function handleLoggedInUserFingerprint(req, res) {
    const userId = req.session.userId;
    const { visitorId, confidence, version, components } = req.body;

    db.get(
        'SELECT id, visitor_id, components, canvas_fingerprint, webgl_fingerprint, audio_fingerprint, fonts_fingerprint, plugins_fingerprint, hardware_fingerprint, custom_fingerprint FROM fingerprints WHERE linked_user_id = ?',
        [userId],
        (err, existingRecord) => {
            if (err) {
                console.error('查詢用戶指紋錯誤:', err);
                return res.status(500).json({ error: '資料庫查詢失敗' });
            }

            if (existingRecord) {
                const oldData = parseStoredFingerprint(existingRecord);
                const newData = buildNewFingerprintData(req.body);
                const similarity = calculateMultiFingerprintSimilarity(oldData, newData);

                db.run(
                    'UPDATE fingerprints SET visitor_id = ?, confidence_score = ?, confidence_comment = ?, version = ?, components = ?, last_seen = CURRENT_TIMESTAMP WHERE linked_user_id = ?',
                    [
                        visitorId,
                        confidence?.score || 0,
                        confidence?.comment || '',
                        version || '',
                        JSON.stringify(components || {}),
                        userId
                    ],
                    function(updateErr) {
                        if (updateErr) {
                            console.error('更新用戶指紋錯誤:', updateErr);
                            return res.status(500).json({ error: '更新失敗' });
                        }

                        console.log(`更新登入用戶 ${userId} 的指紋, 相似度: ${similarity.toFixed(1)}%`);

                        db.get('SELECT username FROM accounts WHERE id = ?', [userId], (userErr, user) => {
                            res.json({
                                isNewUser: false,
                                userId: existingRecord.id,
                                similarity: similarity,
                                message: `已登入用戶 ${user?.username || userId} 的指紋已更新`,
                                fingerprintChanged: similarity < 90,
                                isLoggedIn: true
                            });
                        });
                    }
                );
            } else {
                db.run(
                    'INSERT INTO fingerprints (visitor_id, confidence_score, confidence_comment, version, components, linked_user_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        visitorId,
                        confidence?.score || 0,
                        confidence?.comment || '',
                        version || '',
                        JSON.stringify(components || {}),
                        userId
                    ],
                    function(insertErr) {
                        if (insertErr) {
                            console.error('新增用戶指紋錯誤:', insertErr);
                            return res.status(500).json({ error: '新增失敗' });
                        }

                        console.log(`新增登入用戶 ${userId} 的指紋記錄`);

                        db.get('SELECT username FROM accounts WHERE id = ?', [userId], (userErr, user) => {
                            res.json({
                                isNewUser: true,
                                userId: this.lastID,
                                message: `已登入用戶 ${user?.username || userId} 的指紋已存儲`,
                                isLoggedIn: true
                            });
                        });
                    }
                );
            }
        }
    );
}

// 處理訪客的指紋（未登入）
function handleGuestUserFingerprint(req, res) {
    db.all(
        'SELECT f.id, f.visitor_id, f.components, f.linked_user_id, a.username FROM fingerprints f LEFT JOIN accounts a ON f.linked_user_id = a.id',
        (err, allUsers) => {
            if (err) {
                console.error('查詢所有指紋錯誤:', err);
                return res.status(500).json({ error: '資料庫查詢失敗' });
            }

            const newData = buildNewFingerprintData(req.body);

            // 與所有現有指紋比對相似度（訪客比對時僅能使用已儲存的 components 欄位）
            const similarityResults = [];

            for (const user of allUsers) {
                const oldData = {
                    components: JSON.parse(user.components || '{}'),
                    canvas: '',
                    webgl: {},
                    audio: {},
                    fonts: {},
                    plugins: {},
                    hardware: {},
                    custom: {}
                };

                const similarity = calculateMultiFingerprintSimilarity(oldData, newData);

                console.log(`與指紋 ID ${user.id} (用戶: ${user.username || '未登入'}) 多重指紋相似度: ${similarity.toFixed(1)}%`);

                if (similarity > 0) {
                    similarityResults.push({
                        id: user.linked_user_id || user.id,
                        username: user.username || `ID-${user.linked_user_id || user.id}`,
                        fingerprintId: user.id,
                        similarity: similarity
                    });
                }
            }

            similarityResults.sort((a, b) => b.similarity - a.similarity);
            const top5Matches = similarityResults.slice(0, 5);

            if (top5Matches.length > 0 && top5Matches[0].similarity >= 20) {
                console.log(`找到 ${top5Matches.length} 個相似用戶，最高相似度: ${top5Matches[0].similarity.toFixed(1)}%`);

                const similarityList = top5Matches
                    .map((match, index) => `${index + 1}. 用戶${match.username}: ${match.similarity.toFixed(1)}%`)
                    .join('\n');

                res.json({
                    isNewUser: true,
                    similarity: top5Matches[0].similarity,
                    topMatches: top5Matches,
                    message: `找到 ${top5Matches.length} 個相似用戶：\n\n${similarityList}`,
                    isGuest: true
                });
            } else {
                console.log('沒有找到相似的指紋');

                res.json({
                    isNewUser: true,
                    similarity: 0,
                    topMatches: [],
                    message: '完全新的訪客，沒有找到相似的指紋',
                    isGuest: true
                });
            }
        }
    );
}

// API 路由：獲取所有指紋記錄
app.get('/api/fingerprints', (req, res) => {
    db.all(
        'SELECT f.id, f.visitor_id, f.confidence_score, f.version, f.created_at, f.last_seen, f.linked_user_id, a.username FROM fingerprints f LEFT JOIN accounts a ON f.linked_user_id = a.id ORDER BY f.last_seen DESC',
        (err, rows) => {
            if (err) {
                console.error('查詢錯誤:', err);
                return res.status(500).json({ error: '查詢失敗' });
            }

            res.json(rows);
        }
    );
});

// API 路由：獲取指紋詳細資料（調試用）
app.get('/api/debug/fingerprint/:id', (req, res) => {
    db.get(
        'SELECT f.*, a.username FROM fingerprints f LEFT JOIN accounts a ON f.linked_user_id = a.id WHERE f.id = ?',
        [req.params.id],
        (err, row) => {
            if (err) {
                console.error('查詢錯誤:', err);
                return res.status(500).json({ error: '查詢失敗' });
            }

            if (!row) {
                return res.status(404).json({ error: '找不到指紋記錄' });
            }

            const components = JSON.parse(row.components || '{}');
            const componentNames = Object.keys(components).sort();

            res.json({
                ...row,
                components: components,
                componentNames: componentNames,
                componentCount: componentNames.length
            });
        }
    );
});

// API 路由：獲取統計資料
app.get('/api/stats', (req, res) => {
    db.get(
        'SELECT COUNT(*) as total_fingerprints, AVG(confidence_score) as avg_confidence, COUNT(DISTINCT linked_user_id) as total_linked_users FROM fingerprints',
        (err, row) => {
            if (err) {
                console.error('統計查詢錯誤:', err);
                return res.status(500).json({ error: '統計查詢失敗' });
            }

            res.json({
                totalFingerprints: row.total_fingerprints,
                totalLinkedUsers: row.total_linked_users,
                averageConfidence: row.avg_confidence ? (row.avg_confidence * 100).toFixed(1) : 0
            });
        }
    );
});

// API 路由：識別最可能的用戶關聯（未登入用戶使用）
app.get('/api/identify', (req, res) => {
    if (req.session.userId) {
        return res.json({
            loggedIn: true,
            user: {
                id: req.session.userId,
                username: req.session.username
            }
        });
    }

    const currentVisitorId = req.query.visitorId;
    if (!currentVisitorId) {
        return res.json({ loggedIn: false, message: '沒有指紋資料' });
    }

    db.get(
        'SELECT id, components FROM fingerprints WHERE visitor_id = ?',
        [currentVisitorId],
        (err, currentFingerprint) => {
            if (err || !currentFingerprint) {
                return res.json({ loggedIn: false, message: '找不到當前指紋' });
            }

            db.all(
                'SELECT f.id, f.visitor_id, f.components, f.linked_user_id, a.username FROM fingerprints f INNER JOIN accounts a ON f.linked_user_id = a.id',
                (err, linkedFingerprints) => {
                    if (err || !linkedFingerprints.length) {
                        return res.json({ loggedIn: false, message: '沒有已關聯的用戶' });
                    }

                    const currentComponents = JSON.parse(currentFingerprint.components || '{}');
                    let bestMatch = null;
                    let highestSimilarity = 0;

                    for (const linkedFingerprint of linkedFingerprints) {
                        const linkedComponents = JSON.parse(linkedFingerprint.components || '{}');
                        const similarity = calculateFingerprintJSSimilarity(linkedComponents, currentComponents);

                        if (similarity > highestSimilarity) {
                            highestSimilarity = similarity;
                            bestMatch = linkedFingerprint;
                        }
                    }

                    if (bestMatch && highestSimilarity >= 70) {
                        res.json({
                            loggedIn: false,
                            likelyUser: {
                                userId: bestMatch.linked_user_id,
                                username: bestMatch.username,
                                similarity: Math.round(highestSimilarity)
                            },
                            message: `新使用者，最可能是 ${bestMatch.username} (${Math.round(highestSimilarity)}%)`
                        });
                    } else {
                        res.json({
                            loggedIn: false,
                            message: '新使用者，無法關聯到已知用戶'
                        });
                    }
                }
            );
        }
    );
});

// 首頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error('伺服器錯誤:', err);
    res.status(500).json({ error: '內部伺服器錯誤' });
});

// 匯出供測試使用的物件
module.exports = {
    app,
    db,
    generateMathCaptcha,
    verifyMathCaptcha,
    calculateMultiFingerprintSimilarity,
    calculateFingerprintJSSimilarity,
    calculateCanvasSimilarity,
    calculateWebGLSimilarity,
    calculateAudioSimilarity,
    calculateFontsSimilarity,
    calculateHardwareSimilarity,
    calculateCustomSimilarity,
    calculateArraySimilarity,
    hashString,
    findChangedComponents
};

// 啟動伺服器
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`伺服器運行在 http://0.0.0.0:${PORT}`);
        console.log('FingerprintJS V4 指紋採集測試網站已啟動');
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// 優雅關閉
process.on('SIGINT', () => {
    console.log('\n正在關閉伺服器...');
    db.close((err) => {
        if (err) {
            console.error('關閉資料庫時發生錯誤:', err);
        } else {
            console.log('資料庫已關閉');
        }
        process.exit(0);
    });
});
