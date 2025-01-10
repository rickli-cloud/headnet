FROM golang:latest as build

WORKDIR /work

COPY build/ build/
COPY server.go server.go

RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build $PWD/server.go

FROM scratch

LABEL maintainer=github/rickli-cloud

COPY --from=build /work/server .

EXPOSE 3000

ENTRYPOINT [ "/server" ]
