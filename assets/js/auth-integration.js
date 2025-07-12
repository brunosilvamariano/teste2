// Authentication Integration for Main Site
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

// DOM Elements
const loginButton = document.getElementById('loginButton');
const userInfo = document.getElementById('userInfo');
const userPhone = document.getElementById('userPhone');
const userAvatar = document.getElementById('userAvatar');

// Modal elements
const loginModal = document.getElementById('loginModal');
const modalPhoneNumber = document.getElementById('modalPhoneNumber');
const modalSendCodeBtn = document.getElementById('modalSendCodeBtn');
const modalVerificationSection = document.getElementById('modalVerificationSection');
const modalVerificationCode = document.getElementById('modalVerificationCode');
const modalVerifyCodeBtn = document.getElementById('modalVerifyCodeBtn');
const modalMessageContainer = document.getElementById('modalMessageContainer');

let modalRecaptchaVerifier;

// Initialize authentication state
document.addEventListener('DOMContentLoaded', function() {
    checkAuthenticationState();
    setupModalEventListeners();
});

// Check authentication state
function checkAuthenticationState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            showUserInfo(user);
            // Update checkout button state when user logs in
            if (window.AuthCheckoutModule) {
                window.AuthCheckoutModule.updateCheckoutButtonState();
            }
        } else {
            showLoginButton();
            // Update checkout button state when user logs out
            if (window.AuthCheckoutModule) {
                window.AuthCheckoutModule.updateCheckoutButtonState();
            }
        }
    });
}

// Show user info when logged in
function showUserInfo(user) {
    if (loginButton) loginButton.style.display = 'none';
    if (userInfo) {
        userInfo.style.display = 'flex';
        userInfo.classList.add('show');
    }
    
    if (userPhone) {
        userPhone.textContent = user.phoneNumber || 'Usuário logado';
    }
    
    if (userAvatar) {
        const phoneNumber = user.phoneNumber || '';
        const initials = phoneNumber.slice(-2) || 'U';
        userAvatar.textContent = initials;
    }
}

// Show login button when not logged in
function showLoginButton() {
    if (userInfo) {
        userInfo.style.display = 'none';
        userInfo.classList.remove('show');
    }
    if (loginButton) loginButton.style.display = 'flex';
}

// Open login modal
function openLoginModal() {
    const modal = new bootstrap.Modal(loginModal);
    modal.show();
    
    // Initialize modal reCAPTCHA when modal is shown
    setTimeout(() => {
        initializeModalRecaptcha();
    }, 500);
}

// Initialize modal reCAPTCHA
function initializeModalRecaptcha() {
    if (!modalRecaptchaVerifier) {
        try {
            console.log('Inicializando reCAPTCHA modal...');
            console.log('Domínio atual:', window.location.hostname);
            console.log('URL completa:', window.location.href);
            
            modalRecaptchaVerifier = new RecaptchaVerifier(auth, 'modalRecaptchaContainer', {
                'size': 'normal',
                'callback': (response) => {
                    console.log('Modal reCAPTCHA resolvido com sucesso');
                },
                'expired-callback': () => {
                    console.log('Modal reCAPTCHA expirou');
                    showModalMessage('reCAPTCHA expirou. Tente novamente.', 'error');
                },
                'error-callback': (error) => {
                    console.error('Erro no reCAPTCHA:', error);
                    showModalMessage('Erro no reCAPTCHA. Recarregue a página e tente novamente.', 'error');
                }
            });
            
            modalRecaptchaVerifier.render().then(() => {
                console.log('reCAPTCHA renderizado com sucesso');
            }).catch((error) => {
                console.error('Erro ao renderizar reCAPTCHA:', error);
                showModalMessage('Erro ao carregar reCAPTCHA. Verifique sua conexão e recarregue a página.', 'error');
            });
        } catch (error) {
            console.error('Erro ao inicializar modal reCAPTCHA:', error);
            showModalMessage('Erro ao inicializar reCAPTCHA. Recarregue a página e tente novamente.', 'error');
        }
    }
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Phone number formatting
    if (modalPhoneNumber) {
        modalPhoneNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                if (value.length <= 2) {
                    value = '+55 ' + value;
                } else if (value.length <= 4) {
                    value = '+55 ' + value.substring(2, 4);
                } else if (value.length <= 9) {
                    value = '+55 ' + value.substring(2, 4) + ' ' + value.substring(4);
                } else {
                    value = '+55 ' + value.substring(2, 4) + ' ' + value.substring(4, 9) + '-' + value.substring(9, 13);
                }
            }
            
            e.target.value = value;
        });
    }

    // Send code button
    if (modalSendCodeBtn) {
        modalSendCodeBtn.addEventListener('click', sendModalVerificationCode);
    }

    // Verify code button
    if (modalVerifyCodeBtn) {
        modalVerifyCodeBtn.addEventListener('click', verifyModalCode);
    }

    // Auto-submit when 6 digits are entered
    if (modalVerificationCode) {
        modalVerificationCode.addEventListener('input', (e) => {
            const value = e.target.value.replace(/\D/g, '');
            e.target.value = value;
            
            if (value.length === 6) {
                setTimeout(() => {
                    verifyModalCode();
                }, 500);
            }
        });
    }

    // Reset modal when closed
    if (loginModal) {
        loginModal.addEventListener('hidden.bs.modal', resetModal);
    }
}

// Send verification code in modal
async function sendModalVerificationCode() {
    const phoneNumber = formatPhoneNumber(modalPhoneNumber.value);
    
    if (!phoneNumber || phoneNumber.length < 14) {
        showModalMessage('Por favor, insira um número de celular válido.', 'error');
        return;
    }

    setModalLoading(modalSendCodeBtn, true);
    showModalMessage('Enviando código...', 'info');

    try {
        if (!modalRecaptchaVerifier) {
            initializeModalRecaptcha();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Tentando enviar código para:', phoneNumber);
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, modalRecaptchaVerifier);
        window.modalConfirmationResult = confirmationResult;
        
        modalVerificationSection.style.display = 'block';
        modalSendCodeBtn.style.display = 'none';
        showModalMessage('Código enviado para o seu celular!', 'success');
        modalVerificationCode.focus();
        
    } catch (error) {
        console.error("Erro detalhado ao enviar código: ", error);
        console.error("Código do erro:", error.code);
        console.error("Mensagem do erro:", error.message);
        
        let errorMessage = 'Erro ao enviar código. ';
        
        if (error.code === 'auth/invalid-phone-number') {
            errorMessage += 'Número de telefone inválido. Verifique o formato (+55 11 99999-9999).';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage += 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
        } else if (error.code === 'auth/captcha-check-failed') {
            errorMessage += 'Falha na verificação reCAPTCHA. Recarregue a página e tente novamente.';
        } else if (error.code === 'auth/invalid-app-credential') {
            errorMessage += 'Configuração do Firebase incorreta. Entre em contato com o suporte.';
        } else if (error.code === 'auth/quota-exceeded') {
            errorMessage += 'Limite de SMS excedido. Tente novamente mais tarde.';
        } else if (error.code === 'auth/app-not-authorized') {
            errorMessage += 'Aplicação não autorizada. Entre em contato com o suporte.';
        } else {
            errorMessage += `Verifique o número e tente novamente. (Erro: ${error.code})`;
        }
        
        showModalMessage(errorMessage, 'error');
        
        // Reset reCAPTCHA on error
        if (modalRecaptchaVerifier) {
            try {
                modalRecaptchaVerifier.clear();
                modalRecaptchaVerifier = null;
                setTimeout(() => {
                    initializeModalRecaptcha();
                }, 1000);
            } catch (resetError) {
                console.error('Erro ao resetar reCAPTCHA:', resetError);
            }
        }
    } finally {
        setModalLoading(modalSendCodeBtn, false);
    }
}

// Verify code in modal
async function verifyModalCode() {
    const code = modalVerificationCode.value.trim();
    
    if (!code || code.length !== 6) {
        showModalMessage('Por favor, insira o código de 6 dígitos.', 'error');
        return;
    }

    setModalLoading(modalVerifyCodeBtn, true);
    showModalMessage('Verificando código...', 'info');

    try {
        const result = await window.modalConfirmationResult.confirm(code);
        const user = result.user;
        
        console.log("Usuário logado: ", user);
        showModalMessage('Login realizado com sucesso!', 'success');
        
        // Store user info in localStorage
        localStorage.setItem('userPhone', user.phoneNumber);
        localStorage.setItem('userUid', user.uid);
        
        // Close modal after successful login
        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(loginModal);
            modal.hide();
            
            // Update checkout button state after login
            if (window.AuthCheckoutModule) {
                window.AuthCheckoutModule.updateCheckoutButtonState();
            }
        }, 1500);
        
    } catch (error) {
        console.error("Erro ao verificar código: ", error);
        let errorMessage = 'Código inválido. ';
        
        if (error.code === 'auth/invalid-verification-code') {
            errorMessage += 'Verifique o código e tente novamente.';
        } else if (error.code === 'auth/code-expired') {
            errorMessage += 'Código expirado. Solicite um novo código.';
        } else {
            errorMessage += 'Tente novamente.';
        }
        
        showModalMessage(errorMessage, 'error');
    } finally {
        setModalLoading(modalVerifyCodeBtn, false);
    }
}

// Logout user
async function logoutUser() {
    try {
        await signOut(auth);
        // Clear localStorage data
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userUid');
        console.log('User signed out');
        
        // Update checkout button state after logout
        if (window.AuthCheckoutModule) {
            setTimeout(() => {
                window.AuthCheckoutModule.updateCheckoutButtonState();
            }, 100);
        }
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Utility functions
function formatPhoneNumber(value) {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length === 11 && !numbers.startsWith('55')) {
        return '+55' + numbers;
    } else if (numbers.length === 13 && numbers.startsWith('55')) {
        return '+' + numbers;
    } else if (numbers.length > 0 && !numbers.startsWith('55')) {
        return '+55' + numbers;
    }
    
    return value;
}

function showModalMessage(text, type = 'info') {
    const alertClass = type === 'error' ? 'alert-danger' : 
                     type === 'success' ? 'alert-success' : 'alert-info';
    
    modalMessageContainer.innerHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

function setModalLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Carregando...';
    } else {
        button.disabled = false;
        if (button === modalSendCodeBtn) {
            button.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Código';
        } else if (button === modalVerifyCodeBtn) {
            button.innerHTML = '<i class="fas fa-check"></i> Verificar Código';
        }
    }
}

function resetModal() {
    // Reset form
    modalPhoneNumber.value = '';
    modalVerificationCode.value = '';
    
    // Reset UI
    modalVerificationSection.style.display = 'none';
    modalSendCodeBtn.style.display = 'block';
    modalMessageContainer.innerHTML = '';
    
    // Reset reCAPTCHA
    if (modalRecaptchaVerifier) {
        modalRecaptchaVerifier.clear();
        modalRecaptchaVerifier = null;
    }
    
    // Clear reCAPTCHA container
    const recaptchaContainer = document.getElementById('modalRecaptchaContainer');
    if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
    }
}

// Make functions globally available
window.openLoginModal = openLoginModal;
window.logoutUser = logoutUser;

