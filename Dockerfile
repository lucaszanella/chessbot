FROM node:10-buster

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install --loglevel verbose

COPY --chown=node:node . .

EXPOSE 8443

RUN ls && cp .env.example .env && npm run knex --knexfile knexfile.js migrate:latest && npm install pg --save

CMD [ "sh","-c","npm run dev"]

