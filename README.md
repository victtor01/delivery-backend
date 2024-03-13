# Projeto delivery - backend

## Sobre
A ideia desse projeto é, além de testar os meus conhecimentos com ferramentas como o Next.js, Nest.js, e etc, criar um app para a solucionar um problema que está acontecendo na minha cidade, onde não há ifood e todos os estabelecimentos tem que constantimente estar pegando os pedidos via whatsapp ou rede social.

## Tecnologias
Para o banckend, vamos utilizar o `Nest.js`.

## Infraestrutura

## Sobre a regra de nogócio
### Resumo
A ideia é criar um app para que os usuários possam criar mais de uma loja, ou seja, basicamente os usuários irão criar
uma loja (delivery) para vender os produtos. Nosso foco é criar um sistema para o delivery. Em tése, os `users` irão criar
`stores` para armazenar os `products`, ou seja:

- `USERS` tem vários `STORES` | Relação de 1 para N;
- `STORES` tem vários `PRODUCTS` | Relação de 1 para N;