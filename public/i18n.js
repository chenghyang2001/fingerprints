// i18n 多語言管理系統
const translations = {
    'zh-TW': {
        // Header
        'header.title': 'FingerprintJS V4 指紋採集測試',
        'header.subtitle': '使用專業級瀏覽器指紋識別技術',
        'header.notLoggedIn': '未登入狀態',
        'header.currentUser': '目前使用者',
        'header.logoutTop': '登出',

        // Buttons
        'btn.collect': '開始採集指紋',
        'btn.collecting': '採集中...',
        'btn.clear': '清除結果',
        'btn.auth': '用戶登入/註冊',
        'btn.logout': '登出',

        // Results
        'result.title': '採集到的指紋資料',
        'result.fpTitle': 'FingerprintJS V4 結果',
        'result.visitorId': '訪客 ID:',
        'result.confidence': '信心度:',
        'result.version': '版本:',
        'result.collectionTime': '採集時間:',
        'result.notCollected': '尚未採集',

        // System Info
        'sys.title': '系統資訊',
        'sys.userAgent': '使用者代理:',
        'sys.screen': '螢幕解析度:',
        'sys.viewport': '瀏覽器視窗:',
        'sys.timezone': '時區:',
        'sys.language': '語言偏好:',
        'sys.platform': '作業系統:',
        'sys.cores': 'CPU 核心數:',
        'sys.memory': '裝置記憶體:',

        // Components
        'comp.title': '指紋元件詳細資料',
        'comp.total': '元件總數:',
        'comp.success': '成功元件:',
        'comp.failed': '失敗元件:',
        'comp.avgTime': '平均採集時間:',
        'comp.listTitle': '元件列表',

        // Debug
        'debug.title': '調試資訊',
        'debug.ready': '準備採集...',

        // Status messages
        'status.ready': '準備就緒，點擊「開始採集指紋」按鈕開始測試',
        'status.loading': '正在載入指紋採集系統...',
        'status.collecting': '正在採集多重指紋...',
        'status.cancelled': '已取消指紋採集',
        'status.loggedOut': '已登出',
        'status.loggedIn': '已登入: ',
        'status.notLoggedIn': '未登入',
        'status.initFail': '系統初始化失敗: ',
        'status.collectFail': '指紋採集失敗: ',
        'status.sendFail': '發送失敗: ',
        'status.done': '處理完成',
        'status.error': '錯誤: ',
        'status.preparingCollect': '準備採集指紋...',

        // Privacy Modal
        'privacy.title': '隱私聲明',
        'privacy.body': '本網頁為展示性測試，將臨時蒐集裝置與瀏覽器設定，不建立持久識別、不作行銷，保存不逾 24 小時，你是否同意？',
        'privacy.agree': '同意',
        'privacy.disagree': '不同意',

        // Auth Modal
        'auth.loginTitle': '用戶登入',
        'auth.username': '用戶名/Email：',
        'auth.password': '密碼：',
        'auth.captcha': '驗證碼：',
        'auth.captchaLoading': '載入中...',
        'auth.refreshCaptcha': '重新生成',
        'auth.rememberMe': '記住我（30 天）',
        'auth.loginBtn': '登入',
        'auth.showRegister': '註冊新帳號',
        'auth.registerUsername': '用戶名：',
        'auth.registerEmail': 'Email：',
        'auth.registerEmailHint': '可用於登入和找回密碼',
        'auth.registerPassword': '密碼：',
        'auth.confirmPassword': '確認密碼：',
        'auth.registerBtn': '註冊',
        'auth.showLogin': '已有帳號，登入',

        // Auth messages
        'auth.enterCredentials': '請輸入用戶名/Email 和密碼',
        'auth.enterCaptcha': '請完成驗證碼',
        'auth.loginFail': '登入失敗',
        'auth.welcomeBack': '歡迎回來，',
        'auth.rememberEnabled': '（已啟用記住我）',
        'auth.enterUsernamePassword': '請輸入用戶名和密碼',
        'auth.usernameMinLength': '用戶名至少需要 3 個字元',
        'auth.passwordMinLength': '密碼至少需要 6 個字元',
        'auth.passwordMismatch': '兩次輸入的密碼不一致',
        'auth.invalidEmail': 'Email 格式不正確',
        'auth.registerSuccess': '註冊成功！正在為您登入...',
        'auth.registerFail': '註冊失敗',
        'auth.logoutFail': '登出失敗',

        // Placeholders
        'ph.loginUsername': '請輸入用戶名或 Email',
        'ph.loginPassword': '請輸入密碼',
        'ph.captcha': '請輸入答案',
        'ph.registerUsername': '請輸入用戶名（必填）',
        'ph.registerEmail': '請輸入 Email（選填）',
        'ph.registerPassword': '請輸入密碼（至少 6 個字元）',
        'ph.confirmPassword': '請再次輸入密碼',

        // Lang toggle
        'lang.toggle': 'EN',
        'lang.ariaLabel': 'Switch to English',
    },
    'en': {
        // Header
        'header.title': 'FingerprintJS V4 Fingerprint Collection Test',
        'header.subtitle': 'Professional Browser Fingerprint Identification',
        'header.notLoggedIn': 'Not logged in',
        'header.currentUser': 'Current User',
        'header.logoutTop': 'Logout',

        // Buttons
        'btn.collect': 'Start Collection',
        'btn.collecting': 'Collecting...',
        'btn.clear': 'Clear Results',
        'btn.auth': 'Login / Register',
        'btn.logout': 'Logout',

        // Results
        'result.title': 'Collected Fingerprint Data',
        'result.fpTitle': 'FingerprintJS V4 Results',
        'result.visitorId': 'Visitor ID:',
        'result.confidence': 'Confidence:',
        'result.version': 'Version:',
        'result.collectionTime': 'Collection Time:',
        'result.notCollected': 'Not collected',

        // System Info
        'sys.title': 'System Information',
        'sys.userAgent': 'User Agent:',
        'sys.screen': 'Screen Resolution:',
        'sys.viewport': 'Viewport:',
        'sys.timezone': 'Timezone:',
        'sys.language': 'Language:',
        'sys.platform': 'Platform:',
        'sys.cores': 'CPU Cores:',
        'sys.memory': 'Device Memory:',

        // Components
        'comp.title': 'Fingerprint Component Details',
        'comp.total': 'Total Components:',
        'comp.success': 'Successful:',
        'comp.failed': 'Failed:',
        'comp.avgTime': 'Avg Collection Time:',
        'comp.listTitle': 'Component List',

        // Debug
        'debug.title': 'Debug Info',
        'debug.ready': 'Ready...',

        // Status messages
        'status.ready': 'Ready. Click "Start Collection" to begin.',
        'status.loading': 'Loading fingerprint system...',
        'status.collecting': 'Collecting fingerprints...',
        'status.cancelled': 'Collection cancelled',
        'status.loggedOut': 'Logged out',
        'status.loggedIn': 'Logged in: ',
        'status.notLoggedIn': 'Not logged in',
        'status.initFail': 'Initialization failed: ',
        'status.collectFail': 'Collection failed: ',
        'status.sendFail': 'Send failed: ',
        'status.done': 'Done',
        'status.error': 'Error: ',
        'status.preparingCollect': 'Preparing collection...',

        // Privacy Modal
        'privacy.title': 'Privacy Notice',
        'privacy.body': 'This is a demo site that temporarily collects device and browser settings. No persistent identification or marketing. Data retained for up to 24 hours. Do you agree?',
        'privacy.agree': 'Agree',
        'privacy.disagree': 'Disagree',

        // Auth Modal
        'auth.loginTitle': 'User Login',
        'auth.username': 'Username / Email:',
        'auth.password': 'Password:',
        'auth.captcha': 'Captcha:',
        'auth.captchaLoading': 'Loading...',
        'auth.refreshCaptcha': 'Refresh',
        'auth.rememberMe': 'Remember me (30 days)',
        'auth.loginBtn': 'Login',
        'auth.showRegister': 'Create Account',
        'auth.registerUsername': 'Username:',
        'auth.registerEmail': 'Email:',
        'auth.registerEmailHint': 'For login and password recovery',
        'auth.registerPassword': 'Password:',
        'auth.confirmPassword': 'Confirm Password:',
        'auth.registerBtn': 'Register',
        'auth.showLogin': 'Already have an account',

        // Auth messages
        'auth.enterCredentials': 'Please enter username/email and password',
        'auth.enterCaptcha': 'Please complete the captcha',
        'auth.loginFail': 'Login failed',
        'auth.welcomeBack': 'Welcome back, ',
        'auth.rememberEnabled': ' (Remember me enabled)',
        'auth.enterUsernamePassword': 'Please enter username and password',
        'auth.usernameMinLength': 'Username must be at least 3 characters',
        'auth.passwordMinLength': 'Password must be at least 6 characters',
        'auth.passwordMismatch': 'Passwords do not match',
        'auth.invalidEmail': 'Invalid email format',
        'auth.registerSuccess': 'Registration successful! Logging in...',
        'auth.registerFail': 'Registration failed',
        'auth.logoutFail': 'Logout failed',

        // Placeholders
        'ph.loginUsername': 'Enter username or email',
        'ph.loginPassword': 'Enter password',
        'ph.captcha': 'Enter answer',
        'ph.registerUsername': 'Enter username (required)',
        'ph.registerEmail': 'Enter email (optional)',
        'ph.registerPassword': 'Enter password (min 6 chars)',
        'ph.confirmPassword': 'Re-enter password',

        // Lang toggle
        'lang.toggle': '中',
        'lang.ariaLabel': '切換為中文',
    }
};

// I18nManager class
class I18nManager {
    constructor() {
        this.lang = this.getStoredLang() || 'zh-TW';
        this.button = null;
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
        this.button = document.getElementById('langToggle');
        if (this.button) {
            this.button.addEventListener('click', () => this.toggle());
        }
        this.apply();
    }

    // 取得翻譯文字
    t(key, fallback) {
        const dict = translations[this.lang];
        if (dict && dict[key] !== undefined) {
            return dict[key];
        }
        // fallback 到中文
        const zhDict = translations['zh-TW'];
        if (zhDict && zhDict[key] !== undefined) {
            return zhDict[key];
        }
        return fallback || key;
    }

    // 切換語言
    toggle() {
        this.lang = this.lang === 'zh-TW' ? 'en' : 'zh-TW';
        this.setStoredLang(this.lang);
        this.apply();
    }

    // 套用翻譯到所有標記元素
    apply() {
        // data-i18n: textContent
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // data-i18n-placeholder: placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // data-i18n-aria: aria-label
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            el.setAttribute('aria-label', this.t(key));
        });

        // 更新 html lang 屬性
        document.documentElement.setAttribute('lang', this.lang === 'zh-TW' ? 'zh-TW' : 'en');
        document.documentElement.setAttribute('data-lang', this.lang);

        // 更新動態狀態列
        const userStatus = document.getElementById('userStatus');
        if (userStatus) {
            const text = userStatus.textContent.trim();
            const statusKeys = ['status.ready', 'status.loading', 'status.collecting',
                'status.cancelled', 'status.loggedOut', 'status.notLoggedIn', 'status.preparingCollect'];
            for (const key of statusKeys) {
                const zhVal = translations['zh-TW'][key];
                const enVal = translations['en'][key];
                if (text === zhVal || text === enVal) {
                    userStatus.textContent = this.t(key);
                    break;
                }
            }
        }

        // 更新切換按鈕文字
        const toggleText = document.querySelector('#langToggle .lang-toggle-text');
        if (toggleText) {
            toggleText.textContent = this.t('lang.toggle');
        }
        if (this.button) {
            this.button.setAttribute('aria-label', this.t('lang.ariaLabel'));
        }
    }

    getStoredLang() {
        try {
            return localStorage.getItem('lang');
        } catch (e) {
            return null;
        }
    }

    setStoredLang(lang) {
        try {
            localStorage.setItem('lang', lang);
        } catch (e) {
            // ignore
        }
    }
}

// 立即初始化
const i18nManager = new I18nManager();
