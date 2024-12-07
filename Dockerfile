FROM denoland/deno:distroless

WORKDIR /app

COPY ./build .

EXPOSE 3000

CMD [ "run", "--allow-env", "--allow-read=/app", "--allow-net=0.0.0.0:3000", "index.js" ]
