package com.freeline.common.hdfs;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class HdfsClient {

    private final String webhdfsUrl;

    public HdfsClient(@Value("${hdfs.webhdfs-url}") String webhdfsUrl) {
        this.webhdfsUrl = webhdfsUrl;
    }

    public void mkdirs(String path) {
        URI uri = URI.create(webhdfsUrl + "/webhdfs/v1" + path + "?op=MKDIRS");
        try {
            HttpURLConnection conn = openConnection(uri, "PUT");
            int status = conn.getResponseCode();
            conn.disconnect();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new HdfsException("MKDIRS failed: HTTP " + status + " for " + path);
            }
            log.info("HDFS mkdir: {}", path);
        } catch (IOException e) {
            throw new HdfsException("HDFS MKDIRS failed for " + path, e);
        }
    }

    public void createFile(String path, byte[] content) {
        URI redirectUri = initiateCreate(path);
        writeContent(redirectUri, content);
        log.info("HDFS write: {} ({} bytes)", path, content.length);
    }

    public void createFile(String path, String content) {
        createFile(path, content.getBytes(StandardCharsets.UTF_8));
    }

    public void delete(String path, boolean recursive) {
        URI uri = URI.create(
                webhdfsUrl + "/webhdfs/v1" + path + "?op=DELETE&recursive=" + recursive);
        try {
            HttpURLConnection conn = openConnection(uri, "DELETE");
            int status = conn.getResponseCode();
            conn.disconnect();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new HdfsException("DELETE failed: HTTP " + status + " for " + path);
            }
            log.info("HDFS delete: {}", path);
        } catch (IOException e) {
            throw new HdfsException("HDFS DELETE failed for " + path, e);
        }
    }

    private URI initiateCreate(String path) {
        URI uri = URI.create(
                webhdfsUrl + "/webhdfs/v1" + path + "?op=CREATE&overwrite=true");
        try {
            HttpURLConnection conn = openConnection(uri, "PUT");
            conn.setInstanceFollowRedirects(false);
            int status = conn.getResponseCode();
            if (status != HttpURLConnection.HTTP_MOVED_TEMP) {
                conn.disconnect();
                throw new HdfsException(
                        "Expected 307 redirect for CREATE, got HTTP " + status);
            }
            String location = conn.getHeaderField("Location");
            conn.disconnect();
            return URI.create(location);
        } catch (IOException e) {
            throw new HdfsException("HDFS CREATE initiate failed for " + path, e);
        }
    }

    private void writeContent(URI redirectUri, byte[] content) {
        try {
            HttpURLConnection conn = openConnection(redirectUri, "PUT");
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/octet-stream");
            try (OutputStream out = conn.getOutputStream()) {
                out.write(content);
            }
            int status = conn.getResponseCode();
            conn.disconnect();
            if (status != HttpURLConnection.HTTP_CREATED) {
                throw new HdfsException(
                        "HDFS write failed: HTTP " + status);
            }
        } catch (IOException e) {
            throw new HdfsException("HDFS write to datanode failed", e);
        }
    }

    private HttpURLConnection openConnection(URI uri, String method)
            throws IOException {
        HttpURLConnection conn = (HttpURLConnection) uri.toURL().openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(30_000);
        return conn;
    }
}
