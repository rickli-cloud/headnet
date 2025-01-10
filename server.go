package main

import (
	"embed"
	"encoding/json"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

var (
	//go:embed build/* build/_app/immutable/chunks/*
	embedded        embed.FS
	staticPath      string = "build"
	prefix          string = "/admin"
	indexPath       string = "index.html"
	listenAddr      string = ":3000"
	publicEnvPrefix string = "PUBLIC_"
)

func main() {
	sub, err := fs.Sub(embedded, staticPath)
	if err != nil {
		log.Fatalf("Failed to get embedded frontend subdirectory: %s\n", err.Error())
	}

	publicEnv := make(map[string]string)

	for _, env := range os.Environ() {
		pair := strings.SplitN(env, "=", 2)
		if len(pair) != 2 {
			continue
		}

		key, value := pair[0], pair[1]

		if strings.HasPrefix(key, publicEnvPrefix) {
			publicEnv[key] = value
		}
	}

	publicEnvString, err := json.Marshal(publicEnv)
	if err != nil {
		log.Fatalf("Failed to parse public environment config: %s\n", err.Error())
	}

	fileServer := http.FileServer(http.FS(sub))

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path, err := filepath.Abs(r.URL.Path)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if path == "/_app/env.js" {
			w.Header().Set("Content-Type", "application/javascript")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("export const env=" + string(publicEnvString)))
			return
		}

		path = filepath.Join(staticPath, path)

		_, err = embedded.Open(path)
		if os.IsNotExist(err) {
			index, err := embedded.ReadFile(filepath.Join(staticPath, indexPath))
			if err != nil {
				log.Printf("Failed to read file: %s\n", err.Error())
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			w.Write(index)
			return
		}
		if err != nil {
			log.Printf("Failed to open file: %s\n", err.Error())
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		fileServer.ServeHTTP(w, r)
	})

	log.Fatal(http.ListenAndServe(listenAddr, loggingMiddleware(http.StripPrefix(prefix, handler))))
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		lrw := &loggingResponseWriter{ResponseWriter: w}
		next.ServeHTTP(lrw, r)
		log.Printf("%s \"%s %s %s\" %d %v \"%s\"", r.RemoteAddr, r.Method, r.URL.Path, r.Proto, lrw.statusCode, time.Since(startTime), r.UserAgent())
	})
}

type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(statusCode int) {
	lrw.statusCode = statusCode
	lrw.ResponseWriter.WriteHeader(statusCode)
}
