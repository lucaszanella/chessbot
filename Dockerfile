FROM node:10-buster

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 8443

RUN ls && npm run knex --knexfile knexfile.js migrate:latest

CMD [ "sh","-c","npm run dev"]

