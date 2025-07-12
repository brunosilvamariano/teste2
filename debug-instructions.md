# Instruções de Depuração - Sistema de Login

## Como identificar a causa do problema

### 1. Abrir o Console do Navegador
1. Pressione F12 ou clique com o botão direito na página e selecione "Inspecionar"
2. Vá para a aba "Console"
3. Tente fazer login novamente
4. Observe as mensagens que aparecem no console

### 2. Verificar Configurações do Firebase

#### No Console do Firebase (https://console.firebase.google.com):

1. **Verificar Domínios Autorizados:**
   - Vá em "Authentication" > "Settings" > "Authorized domains"
   - Certifique-se de que o domínio onde o site está hospedado está na lista
   - Para testes locais, adicione `localhost`

2. **Verificar Configuração do reCAPTCHA:**
   - Vá em "Authentication" > "Sign-in method" > "Phone"
   - Verifique se a autenticação por telefone está habilitada
   - Clique em "reCAPTCHA settings" e verifique se o domínio está autorizado

3. **Verificar Cotas de Uso:**
   - Vá em "Usage" para ver se não excedeu os limites
   - Verifique especialmente "Authentication" e "SMS"

### 3. Códigos de Erro Comuns

- **auth/invalid-phone-number**: Número de telefone em formato incorreto
- **auth/too-many-requests**: Muitas tentativas, aguarde alguns minutos
- **auth/captcha-check-failed**: Problema com reCAPTCHA, recarregue a página
- **auth/invalid-app-credential**: Configuração do Firebase incorreta
- **auth/quota-exceeded**: Limite de SMS excedido
- **auth/app-not-authorized**: Domínio não autorizado no Firebase

### 4. Soluções Rápidas

1. **Recarregar a página** - Resolve problemas temporários do reCAPTCHA
2. **Aguardar 5-10 minutos** - Para resolver "too-many-requests"
3. **Testar com número diferente** - Para verificar se é problema específico do número
4. **Testar em rede diferente** - Para verificar se é problema de conectividade

### 5. Informações para Suporte

Se o problema persistir, colete estas informações:
- Mensagens do console do navegador
- Código de erro específico
- Número de telefone (formato usado)
- Horário da tentativa
- Navegador e versão
- Se funciona em outros dispositivos/redes

