## Problema de Login - Erro ao Enviar Código

**Causa Potencial:**

O erro 'Erro ao enviar código. Verifique o número e tente novamente.' durante o login por número de telefone via Firebase Authentication pode ser causado por:

1.  **Configuração incorreta do Firebase:** Chave de API inválida, domínio de autenticação incorreto, ou projeto não configurado corretamente no console do Firebase.
2.  **Configuração do reCAPTCHA:** reCAPTCHA não configurado corretamente no Firebase, chave do site inválida, ou domínio não autorizado para o reCAPTCHA. **É crucial que o domínio onde a aplicação está hospedada (ou `localhost` para desenvolvimento) esteja autorizado nas configurações do reCAPTCHA no console do Firebase.**
3.  **Cotas do Firebase:** Exceder as cotas de uso do Firebase para autenticação por telefone ou reCAPTCHA.
4.  **Problemas de rede/conectividade:** O dispositivo do cliente ou o servidor Firebase podem estar com problemas de conexão.
5.  **Formato do número de telefone:** O número de telefone pode não estar no formato E.164 (ex: +5511999999999).
6.  **Configurações de segurança do Firebase:** Restrições de IP ou outras configurações de segurança que bloqueiam as requisições.
7.  **Bloqueio de SMS pela operadora:** Em alguns casos, a operadora de telefonia pode estar bloqueando o recebimento de SMS de números curtos ou desconhecidos.
8.  **Ambiente de desenvolvimento/produção:** Diferenças de configuração entre ambientes podem causar o problema.

**Próximos Passos:**

-   Verificar as configurações do Firebase no console, especialmente a lista de domínios autorizados para o reCAPTCHA.
-   Testar com diferentes números de telefone e em diferentes redes.
-   Monitorar os logs do Firebase para erros de autenticação.
-   Garantir que o reCAPTCHA está sendo renderizado e resolvido corretamente.


