// Authentication Checkout Integration Module
const AuthCheckoutModule = {
    // Check if user is logged in
    isUserLoggedIn: function() {
        // Check if Firebase user is authenticated
        return new Promise((resolve) => {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().onAuthStateChanged((user) => {
                    resolve(!!user);
                });
            } else {
                // Fallback: check localStorage for user data
                const userPhone = localStorage.getItem('userPhone');
                const userUid = localStorage.getItem('userUid');
                resolve(!!(userPhone && userUid));
            }
        });
    },

    // Get current user data
    getCurrentUser: function() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            return firebase.auth().currentUser;
        } else {
            // Fallback: get from localStorage
            const userPhone = localStorage.getItem('userPhone');
            const userUid = localStorage.getItem('userUid');
            if (userPhone && userUid) {
                return {
                    phoneNumber: userPhone,
                    uid: userUid
                };
            }
        }
        return null;
    },

    // Update checkout button state based on authentication
    updateCheckoutButtonState: function() {
        const checkoutBtn = document.querySelector('.checkout-btn');
        const cartFooter = document.querySelector('.cart-footer');
        
        if (!checkoutBtn) return;

        this.isUserLoggedIn().then((isLoggedIn) => {
            if (isLoggedIn) {
                // User is logged in - enable checkout normally
                checkoutBtn.disabled = false;
                checkoutBtn.onclick = () => this.handleAuthenticatedCheckout();
                
                // Remove any login required message
                const loginMessage = cartFooter.querySelector('.login-required-message');
                if (loginMessage) {
                    loginMessage.remove();
                }
            } else {
                // User is not logged in - enable button but show login modal when clicked
                checkoutBtn.disabled = false;
                checkoutBtn.onclick = () => this.handleUnauthenticatedCheckout();
                
                // Remove login required message since button will handle it
                const loginMessage = cartFooter.querySelector('.login-required-message');
                if (loginMessage) {
                    loginMessage.remove();
                }
            }
        });
    },

    // Add login required message to cart
    addLoginRequiredMessage: function(cartFooter) {
        const loginMessage = document.createElement('div');
        loginMessage.className = 'login-required-message';
        loginMessage.innerHTML = `
            <div>
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Login necessário</strong><br>
                <small>Faça login para finalizar seu pedido com segurança</small>
                <br>
                <button class="btn btn-sm" onclick="openLoginModal()">
                    <i class="fas fa-sign-in-alt"></i> Fazer Login
                </button>
            </div>
        `;
        
        // Insert before the checkout button
        const checkoutBtn = cartFooter.querySelector('.checkout-btn');
        cartFooter.insertBefore(loginMessage, checkoutBtn);
    },

    // Handle checkout for unauthenticated users
    handleUnauthenticatedCheckout: function() {
        // Check if cart is empty
        if (!window.cart || window.cart.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        // Check if restaurant is open
        if (window.StatusModule && !window.StatusModule.canOrder()) {
            window.StatusModule.showClosedAlert();
            return;
        }

        // Show login modal instead of opening checkout
        this.showLoginModal();
    },

    // Show login modal
    showLoginModal: function() {
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            const modal = new bootstrap.Modal(loginModal);
            modal.show();
        } else {
            // Fallback: redirect to login page
            window.location.href = 'login.html';
        }
    },

    // Handle checkout for authenticated users
    handleAuthenticatedCheckout: function() {
        // Check if cart is empty
        if (!window.cart || window.cart.length === 0) {
            alert("Seu carrinho está vazio!");
            return;
        }

        // Check if restaurant is open
        if (window.StatusModule && !window.StatusModule.canOrder()) {
            window.StatusModule.showClosedAlert();
            return;
        }

        // Open checkout modal normally
        CheckoutModule.openCheckoutModal();
    },

    // Show order confirmation modal with user data
    showOrderConfirmationModal: function(orderData) {
        const modal = document.getElementById('orderConfirmationModal');
        const user = this.getCurrentUser();
        
        if (!user) {
            alert('Erro: Usuário não encontrado. Faça login novamente.');
            return;
        }

        // Populate customer info
        document.getElementById('confirmCustomerName').textContent = orderData.name;
        document.getElementById('confirmCustomerPhone').textContent = user.phoneNumber || 'Não informado';
        document.getElementById('confirmCustomerAddress').textContent = orderData.address;
        document.getElementById('confirmPaymentMethod').textContent = this.getPaymentMethodName(orderData.paymentMethod);

        // Populate order items
        const itemsContainer = document.getElementById('confirmOrderItems');
        itemsContainer.innerHTML = orderData.items.map(item => `
            <div class="item-row">
                <span class="item-name">${CartModule.getItemDisplayName(item.name)}</span>
                <span class="item-quantity">${item.quantity}x</span>
                <span class="item-price">R$ ${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        // Populate totals
        const subtotal = orderData.total - orderData.deliveryFee;
        document.getElementById('confirmSubtotal').textContent = `R$ ${subtotal.toFixed(2)}`;
        document.getElementById('confirmDeliveryFee').textContent = `R$ ${orderData.deliveryFee.toFixed(2)}`;
        document.getElementById('confirmFinalTotal').textContent = `R$ ${orderData.total.toFixed(2)}`;

        // Store order data for confirmation
        window.pendingOrderData = orderData;

        // Show modal
        const confirmationModal = new bootstrap.Modal(modal);
        confirmationModal.show();
    },

    // Get payment method display name
    getPaymentMethodName: function(method) {
        const methods = {
            'pix': 'PIX',
            'credito': 'Cartão de Crédito',
            'debito': 'Cartão de Débito'
        };
        return methods[method] || method;
    },

    // Handle order confirmation
    confirmOrder: function() {
        const orderData = window.pendingOrderData;
        if (!orderData) {
            alert('Erro: Dados do pedido não encontrados.');
            return;
        }

        // Close confirmation modal
        const confirmationModal = bootstrap.Modal.getInstance(document.getElementById('orderConfirmationModal'));
        confirmationModal.hide();

        // Close checkout modal
        const checkoutModal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
        if (checkoutModal) {
            checkoutModal.hide();
        }

        // Process order based on payment method
        if (orderData.paymentMethod === 'pix') {
            // Clear cart first
            CartModule.clearCart();
            
            // Clear checkout form
            const form = document.getElementById('checkoutForm');
            if (form) form.reset();
            
            // Show PIX modal after a short delay
            setTimeout(() => {
                PixModule.showPixModal(orderData.total, orderData);
            }, 500);
        } else {
            // For credit/debit cards, send to WhatsApp
            this.sendWhatsAppOrder(orderData);
            
            // Clear cart and form
            CartModule.clearCart();
            const form = document.getElementById('checkoutForm');
            if (form) form.reset();
            
            // Show success message
            this.showSuccessMessage();
        }

        // Clear pending order data
        window.pendingOrderData = null;
    },

    // Send order via WhatsApp
    sendWhatsAppOrder: function(orderData) {
        const user = this.getCurrentUser();
        
        // Create WhatsApp message
        let message = '🍰 *NOVO PEDIDO - DOCE ENCANTO* 🍰\n\n';
        message += '📋 *ITENS DO PEDIDO:*\n';
        
        orderData.items.forEach(item => {
            message += `• ${item.quantity}x ${CartModule.getItemDisplayName(item.name)} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
        });
        
        message += `\n💰 *TOTAL: R$ ${orderData.total.toFixed(2)}*\n\n`;
        message += '📍 *DADOS PARA ENTREGA:*\n';
        message += `👤 Nome: ${orderData.name}\n`;
        message += `📱 Telefone: ${user.phoneNumber || 'Não informado'}\n`;
        message += `🏠 Endereço: ${orderData.address}\n`;
        message += `💳 Pagamento: ${this.getPaymentMethodName(orderData.paymentMethod)}\n\n`;
        message += '⏰ Aguardando confirmação do pedido!';
        
        // Encode message for WhatsApp
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/5547991597258?text=${encodedMessage}`;
        
        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
    },

    // Show success message
    showSuccessMessage: function() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
            z-index: 9999;
            font-weight: 600;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Pedido enviado com sucesso!<br>
            <small>Você será redirecionado para o WhatsApp.</small>
        `;
        
        document.body.appendChild(notification);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    },

    // Initialize the module
    init: function() {
        // Update checkout button state when page loads
        document.addEventListener('DOMContentLoaded', () => {
            this.updateCheckoutButtonState();
        });

        // Listen for authentication state changes
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(() => {
                this.updateCheckoutButtonState();
            });
        }

        // Setup order confirmation button
        const confirmOrderBtn = document.getElementById('confirmOrderBtn');
        if (confirmOrderBtn) {
            confirmOrderBtn.addEventListener('click', () => {
                this.confirmOrder();
            });
        }

        // Override the original finalizeOrder function
        if (typeof CheckoutModule !== 'undefined') {
            CheckoutModule.originalFinalizeOrder = CheckoutModule.finalizeOrder;
            CheckoutModule.finalizeOrder = () => {
                this.handleFinalizeOrder();
            };
        }
    },

    // Handle finalize order with authentication check
    handleFinalizeOrder: function() {
        this.isUserLoggedIn().then((isLoggedIn) => {
            if (!isLoggedIn) {
                // Show login modal instead of alert
                this.showLoginModal();
                return;
            }

            // Continue with normal checkout flow
            this.proceedWithCheckout();
        });
    },

    // Proceed with checkout after authentication is confirmed
    proceedWithCheckout: function() {

            // Validate form
            const form = document.getElementById('checkoutForm');
            const name = document.getElementById('customerName').value.trim();
            const cep = document.getElementById('customerCep').value.trim();
            const street = document.getElementById('customerStreet').value.trim();
            const neighborhood = document.getElementById('customerNeighborhood').value.trim();
            const number = document.getElementById('customerNumber').value.trim();
            const city = document.getElementById('customerCity').value.trim();
            const state = document.getElementById('customerState').value.trim();
            const complement = document.getElementById('customerComplement').value.trim();
            const paymentMethod = document.getElementById('paymentMethod').value;
            
            // Check required fields
            if (!name || !cep || !street || !neighborhood || !number || !city || !state || !paymentMethod) {
                alert('Por favor, preencha todos os campos obrigatórios!');
                return;
            }
            
            // Validate CEP
            const cepRegex = /^\d{5}-?\d{3}$/;
            if (!cepRegex.test(cep)) {
                alert('Por favor, insira um CEP válido (formato: 12345-678)!');
                return;
            }
            
            // Create full address
            let fullAddress = `${street}, ${number}`;
            if (complement) {
                fullAddress += `, ${complement}`;
            }
            fullAddress += `, ${neighborhood}, ${city} - ${state}, CEP: ${cep}`;
            
            // Validate delivery
            const deliveryResult = DeliveryModule.validarEntrega(neighborhood, city);
            if (!deliveryResult.canDeliver) {
                alert(deliveryResult.message + " Por favor, entre em contato via WhatsApp para finalizar o pedido.");
                return;
            }

            // Calculate final total
            const finalTotal = window.cartTotal + deliveryResult.deliveryFee;

            // Create order data
            const orderData = {
                name,
                address: fullAddress,
                paymentMethod,
                total: finalTotal,
                items: [...window.cart],
                deliveryFee: deliveryResult.deliveryFee
            };

        // Show confirmation modal
        this.showOrderConfirmationModal(orderData);
    }
};

// Initialize the module when the script loads
AuthCheckoutModule.init();

// Make functions globally available
window.AuthCheckoutModule = AuthCheckoutModule;

