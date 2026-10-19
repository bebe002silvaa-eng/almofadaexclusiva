# Integração BlackCat

O site usa a API documentada em <https://docs.blackcatoficial.com/>. A chave API fica exclusivamente no servidor, na variável `BLACKCAT_API_KEY`; não a coloque no painel, em arquivos JavaScript ou no catálogo.

## Preparação

1. Revogue no painel BlackCat qualquer chave privada que tenha sido compartilhada em conversa e gere uma nova.
2. Copie `.env.example` para `.env`. Preencha `BLACKCAT_API_KEY` com a nova chave e defina uma senha forte em `ADMIN_SYNC_PASSWORD`.
3. Execute `py server.py` na pasta do site. Em produção, hospede os arquivos estáticos e a API no mesmo serviço atrás de HTTPS; não exponha a porta HTTP diretamente à internet.
4. Entre no painel da loja, atualize preços e estoques reais, selecione **Gateway de pagamento** e salve. Quando o servidor perguntar, use a senha `ADMIN_SYNC_PASSWORD`; assim o catálogo usado na cobrança é o mesmo catálogo público salvo no servidor.
5. Abra a loja pelo endereço HTTP/HTTPS do servidor. A página aberta diretamente como `file://` não consegue chamar a API.

## Publicar no Render

O arquivo `render.yaml` prepara o serviço Python, a verificação de saúde e um disco persistente para os pedidos/configurações locais da API. Esse disco requer um plano pago do Render; sem armazenamento persistente, os dados da loja podem sumir após uma nova publicação ou reinicialização.

1. Revogue a chave privada anteriormente compartilhada e gere uma nova no painel BlackCat.
2. Publique os arquivos do projeto em um repositório GitHub privado. Não envie `.env`, credenciais, nem arquivos da pasta `.data`.
3. No Render, crie um **Blueprint** conectado ao repositório e confirme a criação do serviço `pc-almofadas-exclusivas`. O Blueprint usa um serviço pago e disco persistente; confira os custos atuais antes de confirmar.
4. No painel Render, abra **Environment** do serviço e preencha `BLACKCAT_API_KEY` com a chave nova e `ADMIN_SYNC_PASSWORD` com uma senha forte. Nunca compartilhe esses valores nem os coloque no repositório.
5. Aguarde o deploy ficar saudável. Abra `/api/health` no endereço Render: `paymentConfigured` deve aparecer como `true` depois de configurar a chave.
6. Abra `/admin.html` pelo endereço Render, faça login no painel da loja, atualize preços/estoques, selecione o gateway e salve. Quando solicitado, informe a senha `ADMIN_SYNC_PASSWORD` configurada no Render. Confirme que a sincronização terminou.
7. Teste primeiro com credenciais/modo de teste fornecidos pela BlackCat, se disponíveis. Só então faça uma cobrança real autorizada. Confira o pedido, o valor, a confirmação e o envio antes de divulgar a loja.

## Antes de divulgar

- O painel começa com estoque zerado e uma chave PIX vazia. Cadastre os preços, estoque e uma chave PIX válida, ou configure as credenciais BlackCat e sincronize o catálogo pelo painel. O checkout não deve ser anunciado como funcional até testar um pedido completo.
- Confirme que o e-mail, telefone/WhatsApp, titular do PIX, endereço de envio, frete, prazos, política de privacidade e condições de troca/devolução são os dados reais da empresa.
- Não envie `.env`, `.data`, `.venv` ou `__pycache__` ao repositório. O `.gitignore` já exclui esses caminhos e credenciais.

O servidor valida produto, preço e estoque usando o catálogo salvo pelo painel; o navegador não determina o valor enviado à BlackCat. O checkout envia PIX, endereço de envio e os dados obrigatórios do cliente. O status é consultado na API BlackCat antes de marcar um pedido como pago.

## Limites informados pela documentação

- A documentação descreve criação de venda PIX (`POST /api/sales/create-sale`) e consulta de status (`GET /api/sales/{transactionId}/status`).
- A documentação consultada não descreve um campo para o código de split informado pela loja; por isso o servidor não o envia. Confirme o procedimento com o suporte BlackCat antes de depender de divisão de valores.
- A documentação consultada não descreve assinatura/verificação de webhook. O site consulta o endpoint de status autenticado da BlackCat em vez de confiar em uma confirmação enviada pelo navegador.
- A loja deve configurar preços, estoque, endereço de envio e credenciais válidas antes de aceitar pedidos reais. O frete não está calculado e deve ser combinado com o comprador.
- Use uma integração de hospedagem com HTTPS, backup e armazenamento persistente para a pasta `.data`; não use o servidor local de desenvolvimento como hospedagem pública.

## Segurança

- `.env` e `.data` são excluídos do Git.
- `ADMIN_SYNC_PASSWORD` protege a sincronização do painel com o catálogo confiável do servidor.
- A chave BlackCat não é enviada ao navegador. O painel não aceita nem armazena chaves privadas.
- Se uma chamada à BlackCat falhar, o checkout informa o erro; não simula sucesso.
