FROM node:22-alpine

WORKDIR /opt/headnet

COPY ./build .

EXPOSE 3000

CMD [ "node", "." ]
