// Firebase Authentication Module
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    RecaptchaVerifier, 
    signInWithPhoneNumber, 
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyANjnUpI50p7SsWPJ54bQqhK_I4ZHVcpcg",
    authDomain: "login-doceencanto.firebaseapp.com",
    projectId: "login-doceencanto",
    storageBucket: "login-doceencanto.firebasestorage.app",
    messagingSenderId: "614055396838",
    appId: "1:614055396838:web:38689dc4ae4ce587d84227"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Global variables
let recaptchaVerifier;
let confirmationResult;

// Initialize reCAPTCHA
function initializeRecaptcha() {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'normal',
            'callback': (response) => {
                console.log('reCAPTCHA solved');
            },
            'expired-callback': () => {
                console.log('reCAPTCHA expired');
            }
        });
    }
    return window.recaptchaVerifier;
}

// Send verification code to phone number
async function sendVerificationCode(phoneNumber) {
    try {
        const appVerifier = initializeRecaptcha();
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        window.confirmationResult = confirmationResult;
        return { success: true, message: 'Código enviado com sucesso!' };
    } catch (error) {
        console.error('Error sending verification code:', error);
        return { success: false, message: 'Erro ao enviar código. Verifique o número e tente novamente.' };
    }
}

// Verify the code entered by user
async function verifyCode(code) {
    try {
        const result = await window.confirmationResult.confirm(code);
        const user = result.user;
        console.log('User signed in:', user);
        return { success: true, user: user, message: 'Login realizado com sucesso!' };
    } catch (error) {
        console.error('Error verifying code:', error);
        return { success: false, message: 'Código inválido. Tente novamente.' };
    }
}

// Check authentication state
function checkAuthState(callback) {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
}

// Sign out user
async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true, message: 'Logout realizado com sucesso!' };
    } catch (error) {
        console.error('Error signing out:', error);
        return { success: false, message: 'Erro ao fazer logout.' };
    }
}

// Export functions for use in other modules
window.FirebaseAuth = {
    sendVerificationCode,
    verifyCode,
    checkAuthState,
    signOutUser,
    initializeRecaptcha
};

