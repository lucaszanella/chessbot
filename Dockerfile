FROM node:10-buster

#RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

#USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 8443

#RUN apt-get update && apt-get install -y sudo

RUN ls && npm run knex --knexfile knexfile.js migrate:latest

CMD [ "sh","-c","npm run dev"]

