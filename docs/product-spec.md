# Especificação do produto

O sistema acompanha a proposta comercial **PNE-2025-001**, referente ao projeto UTI Neonatal do Hospital CASSEMS de Corumbá/MS. A fonte contém **52 tipos de equipamento**, **162 unidades** e valor total de **R$ 4.314.265,40**.

## Perfis de acesso

| Perfil exibido | Papel técnico | Permissões |
|---|---|---|
| Gerenciamento | `admin` | Consultar, incluir e alterar equipamentos, links de nota fiscal e etapas. |
| Acompanhamento | `user` | Consultar painel, itens e etapas sem qualquer operação de escrita. |

## Fluxo obrigatório

Todo equipamento possui exatamente seis etapas, nesta ordem e com estes rótulos: **Aquisição**, **Link da Nota Fiscal**, **Envio**, **Previsão de Entrega**, **Entrega** e **Instalação**. Cada etapa possui situação, data e observações próprias. O equipamento também possui um campo dedicado para a URL da nota fiscal.

As datas de negócio das etapas são persistidas como **UTC Unix timestamps em milissegundos** e convertidas para o fuso local apenas na apresentação. Os campos `createdAt` e `updatedAt` são metadados técnicos de auditoria, mantidos em UTC pelo próprio banco de dados.

## Direção visual

A interface seguirá uma linguagem editorial hospitalar contemporânea: base marfim fria, texto azul-petróleo profundo, destaque verde-cirúrgico e acentos âmbar apenas para atenção. A hierarquia combina tipografia limpa, áreas generosas de respiro, cartões com sombras suaves, bordas discretas, indicadores de progresso claros e movimentos curtos. O painel será responsivo, acessível e orientado à leitura rápida.
