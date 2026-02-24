// 多重指紋採集系統
class MultiFingerprintApp {
    constructor() {
        this.fp = null;
        this.isInitialized = false;
        this.currentUser = null;
        this.clientId = null;
        this.fingerprintData = {};
        this.bindEvents();
        this.setupRealTimeUpdates();
        this.checkAuthStatus();
        this.init();
    }

    // 初始化應用程式
    async init() {
        try {
            console.log('正在初始化多重指紋採集系統...');
            this.updateStatus('正在載入指紋採集系統...', 'ready');

            this.initClientId();
            await this.loadFingerprintJS();
            this.initCanvasFingerprint();

            this.isInitialized = true;
            console.log('多重指紋採集系統初始化成功');

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.updateStatus('準備就緒，點擊「開始採集指紋」按鈕開始測試', 'ready');
                    this.clearResults();
                });
            } else {
                this.updateStatus('準備就緒，點擊「開始採集指紋」按鈕開始測試', 'ready');
                this.clearResults();
            }
        } catch (error) {
            console.error('多重指紋採集系統初始化失敗:', error);
            this.showError('系統初始化失敗: ' + error.message);
        }
    }

    // 初始化 Client ID（從 localStorage 取得或生成新值）
    initClientId() {
        try {
            this.clientId = localStorage.getItem('fingerprint_client_id');
            if (!this.clientId) {
                this.clientId = this.generateClientId();
                localStorage.setItem('fingerprint_client_id', this.clientId);
            }
            console.log('Client ID 初始化完成:', this.clientId);
        } catch (error) {
            // localStorage 在隱私模式下可能拋出例外
            console.error('Client ID 初始化失敗:', error);
            this.clientId = this.generateClientId();
        }
    }

    // 生成 Client ID
    generateClientId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const userAgent = navigator.userAgent.substring(0, 10);
        return `${timestamp}_${random}_${userAgent}`;
    }

    // 載入 FingerprintJS
    async loadFingerprintJS() {
        if (window.fingerprintLoader) {
            console.log('使用 FingerprintLoader 載入 FingerprintJS...');
            await window.fingerprintLoader.load();
        } else {
            await this.waitForFingerprintJS();
        }

        if (typeof FingerprintJS === 'undefined') {
            throw new Error('FingerprintJS 載入失敗');
        }

        this.fp = await FingerprintJS.load();
        console.log('FingerprintJS V4 載入成功');
    }

    // 輪詢等待 FingerprintJS 全域變數出現
    async waitForFingerprintJS() {
        const maxAttempts = 30;

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
            if (typeof FingerprintJS !== 'undefined') {
                console.log('FingerprintJS 已載入');
                return;
            }

            console.log(`等待 FingerprintJS 載入... (${attempts + 1}/${maxAttempts})`);
            this.updateStatus(`等待 FingerprintJS 載入... (${attempts + 1}/${maxAttempts})`, 'collecting');
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        throw new Error('FingerprintJS 載入超時');
    }

    // 初始化 Canvas 指紋
    initCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 200;
            canvas.height = 200;

            // 繪製複雜圖形以產生裝置獨特的渲染結果
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 200, 200);

            ctx.fillStyle = '#ff0000';
            ctx.fillRect(10, 10, 50, 50);

            ctx.fillStyle = '#00ff00';
            ctx.fillRect(70, 70, 50, 50);

            ctx.fillStyle = '#0000ff';
            ctx.fillRect(130, 130, 50, 50);

            ctx.fillStyle = '#000000';
            ctx.font = '16px Arial';
            ctx.fillText('Canvas Fingerprint', 10, 180);

            ctx.beginPath();
            ctx.arc(100, 100, 30, 0, 2 * Math.PI);
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.stroke();

            this.fingerprintData.canvas = canvas.toDataURL();
            console.log('Canvas 指紋初始化完成');
        } catch (error) {
            console.error('Canvas 指紋初始化失敗:', error);
            this.fingerprintData.canvas = 'error';
        }
    }

    // 採集多重指紋
    async collectMultiFingerprint() {
        try {
            this.updateStatus('正在採集多重指紋...', 'collecting');
            this.disableButton('collectBtn');

            const startTime = Date.now();
            const fingerprintData = {
                timestamp: startTime,
                clientId: this.clientId,
                collectionTime: 0,
                components: {}
            };

            // 1. 採集 FingerprintJS V4 指紋
            console.log('採集 FingerprintJS V4 指紋...');
            if (this.fp) {
                const result = await this.fp.get();
                fingerprintData.visitorId = result.visitorId;
                fingerprintData.confidence = result.confidence;
                fingerprintData.version = result.version;
                fingerprintData.components = result.components;
                console.log('FingerprintJS V4 指紋採集完成');
            }

            // 2. 採集自定義指紋
            console.log('採集自定義指紋...');
            fingerprintData.custom = await this.collectCustomFingerprint();

            // 3. 採集 Canvas 指紋
            console.log('採集 Canvas 指紋...');
            fingerprintData.canvas = this.fingerprintData.canvas;

            // 4. 採集 WebGL 指紋
            console.log('採集 WebGL 指紋...');
            fingerprintData.webgl = this.collectWebGLFingerprint();

            // 5. 採集音訊指紋
            console.log('採集音訊指紋...');
            fingerprintData.audio = await this.collectAudioFingerprint();

            // 6. 採集字體指紋
            console.log('採集字體指紋...');
            fingerprintData.fonts = this.collectFontFingerprint();

            // 7. 採集插件指紋
            console.log('採集插件指紋...');
            fingerprintData.plugins = this.collectPluginFingerprint();

            // 8. 採集硬體指紋
            console.log('採集硬體指紋...');
            fingerprintData.hardware = await this.collectHardwareFingerprint();

            fingerprintData.collectionTime = Date.now() - startTime;

            this.updateSystemInfoDisplay(fingerprintData);
            this.updateFingerprintJSDisplay(fingerprintData);
            this.updateDebugInfo(fingerprintData);
            this.displayMultiFingerprintResults(fingerprintData);

            await this.sendMultiFingerprintToServer(fingerprintData);
        } catch (error) {
            console.error('多重指紋採集失敗:', error);
            this.showError('指紋採集失敗: ' + error.message);
        } finally {
            this.enableButton('collectBtn');
        }
    }

    // 採集自定義指紋
    async collectCustomFingerprint() {
        const custom = {};

        try {
            custom.userAgent = navigator.userAgent;
            custom.language = navigator.language;
            custom.languages = navigator.languages;
            custom.platform = navigator.platform;
            custom.cookieEnabled = navigator.cookieEnabled;
            custom.onLine = navigator.onLine;
            custom.hardwareConcurrency = navigator.hardwareConcurrency;
            custom.deviceMemory = navigator.deviceMemory;
            custom.maxTouchPoints = navigator.maxTouchPoints;

            custom.screen = {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            };

            custom.window = {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                outerWidth: window.outerWidth,
                outerHeight: window.outerHeight,
                devicePixelRatio: window.devicePixelRatio
            };

            custom.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            custom.timezoneOffset = new Date().getTimezoneOffset();
            custom.locale = Intl.DateTimeFormat().resolvedOptions().locale;
            custom.numberFormat = Intl.NumberFormat().resolvedOptions().locale;

            if (navigator.getBattery) {
                try {
                    const battery = await navigator.getBattery();
                    custom.battery = {
                        level: battery.level,
                        charging: battery.charging
                    };
                } catch (batteryError) {
                    custom.battery = 'not_supported';
                }
            } else {
                custom.battery = 'not_supported';
            }

            if (navigator.connection) {
                custom.connection = {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt
                };
            }
        } catch (error) {
            console.error('自定義指紋採集錯誤:', error);
            custom.error = error.message;
        }

        return custom;
    }

    // 採集 WebGL 指紋
    collectWebGLFingerprint() {
        const webgl = {};

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

            if (gl) {
                webgl.vendor = gl.getParameter(gl.VENDOR);
                webgl.renderer = gl.getParameter(gl.RENDERER);
                webgl.version = gl.getParameter(gl.VERSION);
                webgl.extensions = gl.getSupportedExtensions();

                webgl.parameters = {
                    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
                    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
                    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
                    aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE),
                    aliasedPointSizeRange: gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)
                };

                gl.clearColor(0.2, 0.3, 0.4, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                const pixels = new Uint8Array(4);
                gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                webgl.pixelData = Array.from(pixels);
            } else {
                webgl.error = 'WebGL not supported';
            }
        } catch (error) {
            console.error('WebGL 指紋採集錯誤:', error);
            webgl.error = error.message;
        }

        return webgl;
    }

    // 採集音訊指紋
    async collectAudioFingerprint() {
        const audio = {};

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            audio.sampleRate = audioContext.sampleRate;
            audio.state = audioContext.state;

            if (audioContext.state === 'suspended') {
                try {
                    await audioContext.resume();
                } catch (resumeError) {
                    console.warn('無法恢復 AudioContext:', resumeError);
                    audio.fingerprint = 'context_suspended';
                    return audio;
                }
            }

            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();

            oscillator.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);

            await new Promise(resolve => setTimeout(resolve, 150));

            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(frequencyData);

            // 計算頻率資料的雜湊值
            let hash = 0;
            for (let i = 0; i < frequencyData.length; i++) {
                hash = ((hash << 5) - hash) + frequencyData[i];
                hash = hash & hash; // 轉換為 32 位整數
            }
            audio.fingerprint = hash.toString(16);

            try {
                await audioContext.close();
            } catch (closeError) {
                console.warn('關閉 AudioContext 失敗:', closeError);
            }
        } catch (error) {
            console.error('音訊指紋採集錯誤:', error);
            audio.error = error.message;
            audio.fingerprint = 'error';
        }

        return audio;
    }

    // 採集字體指紋
    collectFontFingerprint() {
        const fonts = {};

        try {
            const testFonts = [
                'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New',
                'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
                'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Console',
                'Tahoma', 'Geneva', 'Lucida Sans Unicode', 'Franklin Gothic Medium',
                'Arial Narrow', 'Brush Script MT'
            ];

            const testString = 'mmmmmmmmmmlli';
            const testSize = '72px';
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            // 以 monospace 為基準，量測各字體是否有不同渲染寬度
            context.font = testSize + ' monospace';
            const baseWidth = context.measureText(testString).width;

            const availableFonts = testFonts.filter(font => {
                context.font = testSize + ' ' + font + ', monospace';
                return context.measureText(testString).width !== baseWidth;
            });

            fonts.available = availableFonts;
            fonts.count = availableFonts.length;
        } catch (error) {
            console.error('字體指紋採集錯誤:', error);
            fonts.error = error.message;
        }

        return fonts;
    }

    // 採集插件指紋
    collectPluginFingerprint() {
        const plugins = {};

        try {
            if (navigator.plugins) {
                const pluginList = Array.from(navigator.plugins).map(plugin => ({
                    name: plugin.name,
                    description: plugin.description,
                    filename: plugin.filename
                }));
                plugins.browser = pluginList;
                plugins.count = pluginList.length;
            }

            if (navigator.mimeTypes) {
                plugins.mimeTypes = Array.from(navigator.mimeTypes).map(mime => ({
                    type: mime.type,
                    description: mime.description,
                    enabledPlugin: mime.enabledPlugin ? mime.enabledPlugin.name : null
                }));
            }
        } catch (error) {
            console.error('插件指紋採集錯誤:', error);
            plugins.error = error.message;
        }

        return plugins;
    }

    // 採集硬體指紋
    async collectHardwareFingerprint() {
        const hardware = {};

        try {
            hardware.cores = navigator.hardwareConcurrency || 'unknown';
            hardware.memory = navigator.deviceMemory || 'unknown';
            hardware.touchPoints = navigator.maxTouchPoints || 0;

            if (navigator.getBattery) {
                try {
                    const battery = await navigator.getBattery();
                    hardware.battery = {
                        level: battery.level,
                        charging: battery.charging,
                        chargingTime: battery.chargingTime,
                        dischargingTime: battery.dischargingTime
                    };
                } catch (batteryError) {
                    hardware.battery = 'not_supported';
                }
            } else {
                hardware.battery = 'not_supported';
            }

            if (navigator.connection) {
                hardware.connection = {
                    effectiveType: navigator.connection.effectiveType,
                    downlink: navigator.connection.downlink,
                    rtt: navigator.connection.rtt,
                    saveData: navigator.connection.saveData
                };
            }

            hardware.sensors = {
                accelerometer: 'Accelerometer' in window,
                gyroscope: 'Gyroscope' in window,
                magnetometer: 'Magnetometer' in window,
                absoluteOrientation: 'AbsoluteOrientationSensor' in window,
                relativeOrientation: 'RelativeOrientationSensor' in window
            };
        } catch (error) {
            console.error('硬體指紋採集錯誤:', error);
            hardware.error = error.message;
        }

        return hardware;
    }

    // 更新系統資訊顯示
    updateSystemInfoDisplay(data) {
        try {
            // 更新各欄位的輔助函式
            const setField = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            if (data.custom?.userAgent) {
                setField('userAgent', data.custom.userAgent.substring(0, 50) + '...');
            }
            if (data.custom?.screen) {
                setField('screenResolution', `${data.custom.screen.width} × ${data.custom.screen.height}`);
            }
            if (data.custom?.window) {
                setField('viewportSize', `${data.custom.window.innerWidth} × ${data.custom.window.innerHeight}`);
            }
            if (data.custom?.timezone) setField('timezone', data.custom.timezone);
            if (data.custom?.language) setField('language', data.custom.language);
            if (data.custom?.platform) setField('platform', data.custom.platform);
            if (data.custom?.hardwareConcurrency) {
                setField('hardwareConcurrency', `${data.custom.hardwareConcurrency} 核心`);
            }
            if (data.custom?.deviceMemory) {
                setField('deviceMemory', `${data.custom.deviceMemory} GB`);
            }

            if (data.components) {
                const totalComponents = Object.keys(data.components).length;
                const successfulComponents = Object.values(data.components).filter(comp => !comp.error).length;
                const failedComponents = totalComponents - successfulComponents;

                setField('totalComponents', totalComponents);
                setField('successfulComponents', successfulComponents);
                setField('failedComponents', failedComponents);
                setField('averageDuration', `${data.collectionTime}ms`);
            }
        } catch (error) {
            console.error('更新系統資訊顯示失敗:', error);
        }
    }

    // 重置系統資訊顯示
    resetSystemInfoDisplay() {
        try {
            const counterIds = ['totalComponents', 'successfulComponents', 'failedComponents'];
            const textIds = ['userAgent', 'screenResolution', 'viewportSize', 'timezone', 'language', 'platform', 'hardwareConcurrency', 'deviceMemory'];

            counterIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '0';
            });

            textIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '尚未採集';
            });

            const averageDuration = document.getElementById('averageDuration');
            if (averageDuration) averageDuration.textContent = '0ms';

            ['visitorId', 'confidence', 'version', 'collectionTime'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '尚未採集';
            });

            const debugOutput = document.getElementById('debugOutput');
            if (debugOutput) debugOutput.textContent = '準備採集...';
        } catch (error) {
            console.error('重置系統資訊顯示失敗:', error);
        }
    }

    // 更新 FingerprintJS V4 結果顯示
    updateFingerprintJSDisplay(data) {
        try {
            const setField = (id, value) => {
                const el = document.getElementById(id);
                if (el && value) el.textContent = value;
            };

            setField('visitorId', data.visitorId);
            setField('confidence', data.confidence);
            setField('version', data.version);

            if (data.collectionTime) {
                const el = document.getElementById('collectionTime');
                if (el) el.textContent = `${data.collectionTime}ms`;
            }
        } catch (error) {
            console.error('更新 FingerprintJS V4 顯示失敗:', error);
        }
    }

    // 更新調試資訊
    updateDebugInfo(data) {
        try {
            const debugOutput = document.getElementById('debugOutput');
            if (debugOutput) {
                const debugInfo = {
                    timestamp: new Date().toISOString(),
                    visitorId: data.visitorId,
                    confidence: data.confidence,
                    collectionTime: data.collectionTime,
                    components: data.components ? Object.keys(data.components).length : 0,
                    custom: data.custom ? '已採集' : '未採集',
                    canvas: data.canvas ? '已採集' : '未採集',
                    webgl: data.webgl ? '已採集' : '未採集',
                    audio: data.audio ? '已採集' : '未採集',
                    fonts: data.fonts ? `已採集 (${data.fonts.count} 個字體)` : '未採集',
                    plugins: data.plugins ? `已採集 (${data.plugins.count} 個插件)` : '未採集',
                    hardware: data.hardware ? '已採集' : '未採集'
                };

                debugOutput.textContent = JSON.stringify(debugInfo, null, 2);
            }
        } catch (error) {
            console.error('更新調試資訊失敗:', error);
        }
    }

    // 顯示多重指紋結果
    displayMultiFingerprintResults(data) {
        const resultContainer = document.getElementById('componentsList');

        if (!resultContainer) {
            console.error('找不到 componentsList 元素');
            return;
        }

        const html = `
            <div class="fingerprintjs-section">
                <h3>FingerprintJS V4 結果</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <strong>訪客 ID:</strong> <span class="highlight">${data.visitorId || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>信心度:</strong> <span class="highlight">${data.confidence || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>版本:</strong> <span class="highlight">${data.version || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>採集時間:</strong> <span class="highlight">${data.collectionTime}ms</span>
                    </div>
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>Client ID</h3>
                <div class="result-item">
                    <strong>ID:</strong> <span class="highlight">${data.clientId}</span>
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>Canvas 指紋</h3>
                <div class="result-item">
                    <strong>雜湊:</strong> <span class="highlight">${this.hashString(data.canvas || 'N/A')}</span>
                </div>
                <div class="canvas-preview">
                    <img src="${data.canvas || ''}" alt="Canvas 預覽" style="max-width: 200px; border: 1px solid #ddd;">
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>WebGL 指紋</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <strong>渲染器:</strong> <span class="highlight">${data.webgl?.renderer || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>供應商:</strong> <span class="highlight">${data.webgl?.vendor || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>版本:</strong> <span class="highlight">${data.webgl?.version || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>擴展數量:</strong> <span class="highlight">${data.webgl?.extensions?.length || 0}</span>
                    </div>
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>音訊指紋</h3>
                <div class="result-item">
                    <strong>指紋:</strong> <span class="highlight">${data.audio?.fingerprint || 'N/A'}</span>
                </div>
                <div class="result-item">
                    <strong>採樣率:</strong> <span class="highlight">${data.audio?.sampleRate || 'N/A'}</span>
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>字體指紋</h3>
                <div class="result-item">
                    <strong>可用字體數量:</strong> <span class="highlight">${data.fonts?.count || 0}</span>
                </div>
                <div class="components-list">
                    ${(data.fonts?.available || []).slice(0, 10).map(font =>
                        `<div class="component-item">${font}</div>`
                    ).join('')}
                    ${data.fonts?.available?.length > 10 ? `<div class="component-item">... 還有 ${data.fonts.available.length - 10} 個字體</div>` : ''}
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>插件指紋</h3>
                <div class="result-item">
                    <strong>插件數量:</strong> <span class="highlight">${data.plugins?.count || 0}</span>
                </div>
                <div class="components-list">
                    ${(data.plugins?.browser || []).slice(0, 5).map(plugin =>
                        `<div class="component-item">${plugin.name}</div>`
                    ).join('')}
                    ${data.plugins?.browser?.length > 5 ? `<div class="component-item">... 還有 ${data.plugins.browser.length - 5} 個插件</div>` : ''}
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>硬體指紋</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <strong>CPU 核心:</strong> <span class="highlight">${data.hardware?.cores || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>記憶體:</strong> <span class="highlight">${data.hardware?.memory || 'N/A'} GB</span>
                    </div>
                    <div class="result-item">
                        <strong>觸控點:</strong> <span class="highlight">${data.hardware?.touchPoints || 0}</span>
                    </div>
                </div>
            </div>

            <div class="fingerprintjs-section">
                <h3>自定義指紋統計</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <strong>螢幕解析度:</strong> <span class="highlight">${data.custom?.screen?.width || 'N/A'} x ${data.custom?.screen?.height || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>視窗大小:</strong> <span class="highlight">${data.custom?.window?.innerWidth || 'N/A'} x ${data.custom?.window?.innerHeight || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>像素密度:</strong> <span class="highlight">${data.custom?.window?.devicePixelRatio || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                        <strong>時區:</strong> <span class="highlight">${data.custom?.timezone || 'N/A'}</span>
                    </div>
                </div>
            </div>
        `;

        resultContainer.innerHTML = html;
    }

    // 顯示指紋相似度結果
    displaySimilarityResults(topMatches) {
        console.log('displaySimilarityResults 被調用，topMatches:', topMatches);
        const resultContainer = document.getElementById('componentsList');

        if (!resultContainer) {
            console.error('找不到 componentsList 元素');
            return;
        }

        if (!topMatches || topMatches.length === 0) {
            console.log('沒有相似度資料');
            return;
        }

        const similarityHtml = `
            <div class="fingerprintjs-section similarity-results">
                <h3>🔍 相似用戶分析 (前 ${topMatches.length} 名)</h3>
                <div class="similarity-list">
                    ${topMatches.map((match, index) => `
                        <div class="similarity-item ${index === 0 ? 'best-match' : ''}">
                            <div class="rank">#${index + 1}</div>
                            <div class="user-info">
                                <strong>用戶：${match.username}</strong>
                                <div class="similarity-bar">
                                    <div class="similarity-fill" style="width: ${match.similarity}%"></div>
                                    <span class="similarity-percent">${match.similarity.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="similarity-note">
                    <p><strong>說明：</strong>相似度基於多重指紋技術分析，包含 Canvas、WebGL、音訊、字體、硬體等指紋特徵。</p>
                </div>
            </div>
        `;

        resultContainer.innerHTML += similarityHtml;
    }

    // 雜湊字串（djb2 演算法）
    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString(16);
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash; // 轉換為 32 位整數
        }
        return hash.toString(16);
    }

    // 發送多重指紋到伺服器
    async sendMultiFingerprintToServer(data) {
        try {
            const response = await fetch('/api/fingerprint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitorId: data.visitorId,
                    confidence: data.confidence,
                    version: data.version,
                    components: data.components,
                    clientId: data.clientId,
                    custom: data.custom,
                    canvas: data.canvas,
                    webgl: data.webgl,
                    audio: data.audio,
                    fonts: data.fonts,
                    plugins: data.plugins,
                    hardware: data.hardware,
                    collectionTime: data.collectionTime
                })
            });

            const result = await response.json();
            console.log('伺服器回應:', result);

            if (response.ok) {
                console.log('處理伺服器回應，isLoggedIn:', result.isLoggedIn, 'isGuest:', result.isGuest);

                if (result.isLoggedIn) {
                    console.log('已登入用戶，訊息:', result.message);
                    this.updateStatus(result.message, 'logged-in-user');
                } else if (result.isGuest && result.topMatches && result.topMatches.length > 0) {
                    console.log('找到相似用戶:', result.topMatches);
                    this.updateStatus(result.message, 'smart-correlation');
                    this.displaySimilarityResults(result.topMatches);
                } else if (result.isGuest) {
                    console.log('新訪客');
                    this.updateStatus(result.message, 'new-user');
                } else {
                    console.log('未知狀態:', result);
                    this.updateStatus(result.message || '處理完成', 'ready');
                }
            } else {
                this.showError(result.error || '發送失敗');
            }
        } catch (error) {
            console.error('發送指紋資料失敗:', error);
            this.showError('發送失敗: ' + error.message);
        }
    }

    // 綁定事件
    bindEvents() {
        const collectBtn = document.getElementById('collectBtn');
        const clearBtn = document.getElementById('clearBtn');
        const toggleAuthBtn = document.getElementById('toggleAuthBtn');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const showRegisterBtn = document.getElementById('showRegisterBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');
        const closeModalBtn = document.getElementById('closeModal');
        const authModal = document.getElementById('authModal');
        const agreeBtn = document.getElementById('agreeBtn');
        const disagreeBtn = document.getElementById('disagreeBtn');
        const refreshLoginCaptcha = document.getElementById('refreshLoginCaptcha');
        const refreshRegisterCaptcha = document.getElementById('refreshRegisterCaptcha');
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutTopBtn = document.getElementById('logoutTopBtn');

        collectBtn.addEventListener('click', () => this.showPrivacyModal());
        clearBtn.addEventListener('click', () => this.clearResults());
        toggleAuthBtn.addEventListener('click', () => this.showAuthModal());
        loginBtn.addEventListener('click', () => this.login());
        registerBtn.addEventListener('click', () => this.register());
        showRegisterBtn.addEventListener('click', () => this.showRegisterForm());
        showLoginBtn.addEventListener('click', () => this.showLoginForm());
        closeModalBtn.addEventListener('click', () => this.closeAuthModal());
        agreeBtn.addEventListener('click', () => this.agreeToPrivacy());
        disagreeBtn.addEventListener('click', () => this.disagreeToPrivacy());
        refreshLoginCaptcha.addEventListener('click', () => this.loadCaptcha('login'));
        refreshRegisterCaptcha.addEventListener('click', () => this.loadCaptcha('register'));
        logoutBtn.addEventListener('click', () => this.logout());
        logoutTopBtn.addEventListener('click', () => this.logout());

        // 點擊背景關閉彈出視窗
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) this.closeAuthModal();
        });

        const privacyModal = document.getElementById('privacyModal');
        privacyModal.addEventListener('click', (e) => {
            if (e.target === privacyModal) this.closePrivacyModal();
        });

        // ESC 鍵關閉彈出視窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (authModal.classList.contains('show')) this.closeAuthModal();
                if (privacyModal.classList.contains('show')) this.closePrivacyModal();
            }
        });
    }

    // 顯示隱私同意視窗
    showPrivacyModal() {
        document.getElementById('privacyModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 關閉隱私同意視窗
    closePrivacyModal() {
        document.getElementById('privacyModal').classList.remove('show');
        document.body.style.overflow = '';
    }

    // 同意隱私聲明並開始採集
    agreeToPrivacy() {
        this.closePrivacyModal();
        this.collectMultiFingerprint();
    }

    // 拒絕隱私聲明，取消採集
    disagreeToPrivacy() {
        this.closePrivacyModal();
        this.updateStatus('已取消指紋採集', 'cancelled');
    }

    // 顯示認證彈出視窗
    showAuthModal() {
        this.showLoginForm();
        document.getElementById('modalTitle').textContent = '用戶登入';
        this.loadCaptcha('login');
        document.getElementById('authModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 載入數學 CAPTCHA
    async loadCaptcha(type) {
        try {
            console.log(`開始載入 ${type} CAPTCHA...`);

            const response = await fetch('/api/captcha');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('CAPTCHA API 回應資料:', data);

            const questionElement = document.getElementById(`${type}CaptchaQuestion`);
            const inputElement = document.getElementById(`${type}Captcha`);

            if (questionElement) {
                questionElement.textContent = data.question;
                console.log(`已更新 ${type} CAPTCHA 問題:`, data.question);
            } else {
                console.error(`找不到 ${type}CaptchaQuestion 元素`);
            }

            if (inputElement) {
                inputElement.value = '';
            }

            if (data.warning) {
                console.warn('CAPTCHA 警告:', data.warning);
            }
        } catch (error) {
            console.error(`載入 ${type} CAPTCHA 錯誤:`, error);

            const questionElement = document.getElementById(`${type}CaptchaQuestion`);
            if (questionElement) {
                questionElement.textContent = '載入失敗，請重試';
                questionElement.style.color = '#e74c3c';
            }
        }
    }

    // 關閉認證彈出視窗並清空表單
    closeAuthModal() {
        document.getElementById('authModal').classList.remove('show');
        document.body.style.overflow = '';

        const fieldIds = [
            'loginUsername', 'loginPassword', 'loginCaptcha',
            'registerUsername', 'registerEmail', 'registerPassword',
            'confirmPassword', 'registerCaptcha'
        ];
        fieldIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const rememberMe = document.getElementById('rememberMe');
        if (rememberMe) rememberMe.checked = false;

        const errorDiv = document.getElementById('formErrorMessage');
        const successDiv = document.getElementById('formSuccessMessage');
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }

    // 顯示登入表單
    showLoginForm() {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('modalTitle').textContent = '用戶登入';
        this.loadCaptcha('login');
    }

    // 顯示註冊表單
    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
        document.getElementById('modalTitle').textContent = '用戶註冊';
        this.loadCaptcha('register');
    }

    // 清除結果
    clearResults() {
        const resultContainer = document.getElementById('componentsList');
        if (resultContainer) {
            resultContainer.innerHTML = '';
        }

        this.resetSystemInfoDisplay();
        this.updateStatus('準備就緒，點擊「開始採集指紋」按鈕開始測試', 'ready');
    }

    // 更新狀態列
    updateStatus(message, className = 'ready') {
        const statusElement = document.getElementById('userStatus');
        if (statusElement) {
            // smart-correlation 訊息包含換行，需保留 HTML 格式
            if (className === 'smart-correlation') {
                statusElement.innerHTML = message;
            } else {
                statusElement.textContent = message;
            }
            statusElement.className = `user-status ${className}`;
        } else {
            console.warn('找不到 userStatus 元素');
        }
    }

    // 顯示錯誤
    showError(message) {
        this.updateStatus('錯誤: ' + message, 'error');
    }

    // 禁用採集按鈕
    disableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = true;
            button.textContent = '採集中...';
        }
    }

    // 啟用採集按鈕
    enableButton(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = false;
            button.textContent = '開始採集指紋';
        }
    }

    // 設定即時更新
    setupRealTimeUpdates() {
        const updateViewportSize = () => {
            const viewportInfo = document.getElementById('viewportInfo');
            if (viewportInfo) {
                viewportInfo.textContent = `${window.innerWidth} × ${window.innerHeight}`;
            }
        };

        window.addEventListener('resize', updateViewportSize);
        updateViewportSize();
    }

    // 檢查登入狀態
    async checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.updateUserDisplay();
            }
        } catch (error) {
            console.error('檢查認證狀態失敗:', error);
        }
    }

    // 更新使用者顯示狀態
    updateUserDisplay() {
        const userStatus = document.getElementById('userStatus');
        const toggleAuthBtn = document.getElementById('toggleAuthBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const currentUserDisplay = document.getElementById('currentUserDisplay');
        const guestUserDisplay = document.getElementById('guestUserDisplay');
        const currentUserName = document.getElementById('currentUserName');

        if (!userStatus) {
            console.warn('找不到 userStatus 元素');
            return;
        }

        if (this.currentUser) {
            userStatus.textContent = `已登入: ${this.currentUser.username}`;
            userStatus.className = 'user-status logged-in-user';
            if (toggleAuthBtn) toggleAuthBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (currentUserDisplay) currentUserDisplay.style.display = 'block';
            if (guestUserDisplay) guestUserDisplay.style.display = 'none';
            if (currentUserName) currentUserName.textContent = this.currentUser.username;
        } else {
            userStatus.textContent = '未登入';
            userStatus.className = 'user-status ready';
            if (toggleAuthBtn) toggleAuthBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (currentUserDisplay) currentUserDisplay.style.display = 'none';
            if (guestUserDisplay) guestUserDisplay.style.display = 'block';
        }
    }

    // 登入
    async login() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        const captcha = document.getElementById('loginCaptcha').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!username || !password) {
            this.showFormError('請輸入用戶名/Email 和密碼');
            return;
        }

        if (!captcha) {
            this.showFormError('請完成驗證碼');
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, captcha, rememberMe })
            });

            const data = await response.json();

            if (response.ok) {
                this.currentUser = data.user;
                this.updateUserDisplay();
                this.closeAuthModal();
                const rememberText = rememberMe ? '（已啟用記住我）' : '';
                this.showSuccess(`歡迎回來，${data.user.username}！${rememberText}`);
            } else {
                this.showFormError(data.error || '登入失敗');
                this.loadCaptcha('login');
            }
        } catch (error) {
            console.error('登入失敗:', error);
            this.showFormError('登入失敗: ' + error.message);
        }
    }

    // 註冊
    async register() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const captcha = document.getElementById('registerCaptcha').value;

        if (!username || !password) {
            this.showFormError('請輸入用戶名和密碼');
            return;
        }

        if (username.length < 3) {
            this.showFormError('用戶名至少需要 3 個字元');
            return;
        }

        if (password.length < 6) {
            this.showFormError('密碼至少需要 6 個字元');
            return;
        }

        if (password !== confirmPassword) {
            this.showFormError('兩次輸入的密碼不一致');
            return;
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.showFormError('Email 格式不正確');
                return;
            }
        }

        if (!captcha) {
            this.showFormError('請完成驗證碼');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email: email || null, password, captcha })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('註冊成功！正在為您登入...');

                // 1.5 秒後關閉並開啟登入表單，預填用戶名
                setTimeout(() => {
                    this.closeAuthModal();
                    this.showLoginForm();
                    document.getElementById('loginUsername').value = username;
                    this.showAuthModal();
                }, 1500);
            } else {
                this.showFormError(data.error || '註冊失敗');
                this.loadCaptcha('register');
            }
        } catch (error) {
            console.error('註冊失敗:', error);
            this.showFormError('註冊失敗: ' + error.message);
        }
    }

    // 登出
    async logout() {
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });

            if (response.ok) {
                this.currentUser = null;
                this.updateUserDisplay();
                this.updateStatus('已登出', 'ready');
            }
        } catch (error) {
            console.error('登出失敗:', error);
        }
    }

    // 取得或建立表單訊息元素
    getOrCreateFormMessage(id, className) {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('div');
            el.id = id;
            el.className = className;
            const modalBody = document.querySelector('.auth-form:not([style*="display: none"])');
            if (modalBody) {
                modalBody.insertBefore(el, modalBody.firstChild);
            }
        }
        return el;
    }

    // 顯示表單錯誤訊息
    showFormError(message) {
        const errorDiv = this.getOrCreateFormMessage('formErrorMessage', 'form-error-message');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // 5 秒後自動隱藏
        setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
    }

    // 顯示成功訊息
    showSuccess(message) {
        this.updateStatus(message, 'logged-in-user');

        const successDiv = this.getOrCreateFormMessage('formSuccessMessage', 'form-success-message');
        successDiv.textContent = message;
        successDiv.style.display = 'block';

        // 3 秒後自動隱藏
        setTimeout(() => { successDiv.style.display = 'none'; }, 3000);
    }
}

// 主題管理器
class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || 'light';
        this.button = null;
        this.icon = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.applyTheme(this.theme);

        this.button = document.getElementById('themeToggle');
        this.icon = this.button?.querySelector('.theme-toggle-icon');

        if (this.button) {
            this.button.addEventListener('click', () => this.toggleTheme());
        }
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('theme');
        } catch (error) {
            console.warn('無法讀取主題設定:', error);
            return null;
        }
    }

    setStoredTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('無法儲存主題設定:', error);
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
        this.updateIcon();
        this.setStoredTheme(theme);
    }

    toggleTheme() {
        this.applyTheme(this.theme === 'light' ? 'dark' : 'light');
    }

    updateIcon() {
        if (this.icon) {
            this.icon.textContent = this.theme === 'light' ? '🌙' : '☀️';
        }
    }
}

// 初始化主題管理器（立即執行，避免主題閃爍）
const themeManager = new ThemeManager();

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    new MultiFingerprintApp();
});
