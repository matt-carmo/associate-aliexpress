# Sistema de Fila Inteligente de Produtos

## Objetivo

Criar um sistema de distribuição automática de produtos baseado em filas inteligentes, permitindo que o usuário envie links de produtos sem precisar definir manualmente o horário de cada item.

O sistema também deve integrar com o gerador de links de afiliado já existente na plataforma e permitir personalização dinâmica das mensagens enviadas/publicadas.

---

# Conceito do Sistema

O sistema deve funcionar como:

- distribuidor inteligente de produtos
- gerador automático de links afiliados
- sistema de mensagens dinâmicas
- fila automatizada com agendamento híbrido

---

# Integração com Sistema de Afiliados

Antes de enviar/publicar qualquer produto, o sistema deve:

1. pegar a URL original
1.1 identificar o tipo de link (produto, categoria, campanha, homepage, etc)
1.2 extrair informações relevantes (produto, categoria, etc) para personalização da mensagem
1.3 identificar o template de mensagem mais adequado (baseado em tipo de link e informações extraídas)
1.4 montar a mensagem final com placeholders (ex: {product_name}, {affiliate_url}, etc)
2. consumir o endpoint interno de geração de link afiliado
3. receber a URL afiliada
4. utilizar a URL afiliada na mensagem final

O sistema deve funcionar tanto para:
- links de produtos
- links de páginas
- links genéricos
- homepage da AliExpress
- campanhas
- categorias

---

# Exemplo de Fluxo

```text
URL original
    ↓
Gerador de afiliado
    ↓
Link afiliado
    ↓
Montagem da mensagem
    ↓
Fila
    ↓
Envio/publicação
Sistema de Mensagens Personalizadas

O usuário deve conseguir criar templates dinâmicos de mensagem.

Exemplo de Cenário

O usuário pode:

1. Usar um produto como “gancho”

Exemplo:

produto chamativo
oferta principal
item viral

Mas o link enviado pode ser:

outro produto
página da AliExpress
categoria específica
campanha afiliada
Exemplo Real
Produto visual/chamativo

“Mini projetor portátil 4K”

Link real

Homepage da AliExpress afiliada

Mensagem:

🔥 Achado absurdo do dia!

Esse mini projetor portátil está viralizando 😳

🛒 Confira mais ofertas aqui:
{affiliate_url}
Outro Exemplo
Produto chamativo

iPhone

Link real

Página de eletrônicos da AliExpress

Mensagem:

⚡ PROMOÇÃO DE ELETRÔNICOS

Olha isso 😳

{product_name}

Confira todas as ofertas:
{affiliate_url}
Conceito Importante

O sistema deve separar:

Produto de exibição

Usado para:

chamar atenção
thumbnail
imagem
título
copy
Link de destino

Usado para:

monetização
afiliado
redirecionamento

Esses dois NÃO precisam ser o mesmo item.

Templates Dinâmicos

O sistema deve suportar placeholders.

Exemplo:

🔥 {product_name}

💰 Apenas {product_price}

🛒 Link:
{affiliate_url}
Placeholders Esperados
{product_name}
{product_price}
{product_image}
{affiliate_url}
{store_name}
{discount}
{coupon}
{category}
{custom_text}
Tipos de URL Aceitos

O sistema deve aceitar:

produto individual
homepage AliExpress
categoria
campanha
coleção
busca
links externos suportados

Todos devem poder virar:

links afiliados
Funcionamento da Fila
Fluxo automático

O usuário adiciona produtos em uma fila.

O sistema:

organiza automaticamente
calcula horários
distribui os produtos ao longo do tempo

Exemplo:

Produto	Horário
Produto 1	18:00
Produto 2	18:06
Produto 3	18:12
Produto 4	18:18
Intervalo Inteligente

O sistema deve permitir configurar:

intervalo mínimo
intervalo máximo

Exemplo:

mínimo: 5 minutos
máximo: 7 minutos

A cada novo produto:

o sistema sorteia automaticamente um tempo dentro da faixa definida

Objetivo:

comportamento mais natural
evitar padrões repetitivos
reduzir risco de bloqueios/spam
Produtos Agendados (Prioridade Alta)

O usuário pode opcionalmente definir:

data
horário específico

Exemplo:

Produto X → 22:00

Esses produtos NÃO devem travar a fila automática.

Eles funcionam como:

reservas de horário
injeções na timeline
Regra Importante

A fila automática nunca deve depender do horário do último produto manual.

ERRADO:

próximo produto depende do último horário configurado

CERTO:

cada produto calcula o próximo slot livre disponível
Exemplo Correto
Produtos automáticos
Produto A
Produto B
Produto C
Produto agendado
Produto X → 22:00

Resultado:

Horário	Produto
18:00	Produto A
18:06	Produto B
18:12	Produto C
22:00	Produto X

A fila continua funcionando normalmente sem pausas de várias horas.

Janela de Funcionamento

O sistema deve permitir:

Horário ativo

Exemplo:

iniciar distribuição às 08:00
parar às 22:00

Se a fila ultrapassar esse horário:

pausar automaticamente
continuar no próximo período válido
Modos de Distribuição

Criar presets:

Seguro

10–15 min

Normal

5–7 min

Agressivo

1–3 min

Personalizado

Usuário define faixa manualmente

Estrutura do Produto

Cada item da fila deve possuir:

id
url_original
affiliate_url
display_product
status
prioridade
template_message
horário agendado opcional
horário calculado
data de criação
Status Possíveis
Produto
pending
scheduled
processing
sent
failed
paused
Afiliado
generating
generated
failed
Objetivo Técnico

O sistema deve:

evitar dependência entre produtos
impedir buracos na timeline
permitir escalabilidade
reduzir configuração manual
manter distribuição natural
integrar automaticamente com afiliados
permitir mistura entre automático e agendado
suportar templates dinâmicos
desacoplar produto visual do link final
UX Esperada

O usuário idealmente só precisa:

adicionar links
escolher um template
escolher frequência
opcionalmente agendar alguns produtos

Todo o restante:

geração de afiliado
criação da mensagem
cálculo de horários
distribuição
gerenciamento da fila

deve ser automatizado pelo sistema.