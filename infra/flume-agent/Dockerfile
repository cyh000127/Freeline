FROM eclipse-temurin:11-jre-alpine

ENV FLUME_VERSION=1.11.0
ENV FLUME_HOME=/opt/flume

RUN apk add --no-cache bash curl \
    && curl -fSL "https://archive.apache.org/dist/flume/${FLUME_VERSION}/apache-flume-${FLUME_VERSION}-bin.tar.gz" \
       -o /tmp/flume.tar.gz \
    && mkdir -p ${FLUME_HOME} \
    && tar -xzf /tmp/flume.tar.gz -C ${FLUME_HOME} --strip-components=1 \
    && rm /tmp/flume.tar.gz

# Hadoop client libs for HDFS sink
COPY --from=apache/hadoop:3.4.1 /opt/hadoop/share/hadoop/common/ ${FLUME_HOME}/lib/
COPY --from=apache/hadoop:3.4.1 /opt/hadoop/share/hadoop/hdfs/ ${FLUME_HOME}/lib/

# Remove conflicting guava version
RUN rm -f ${FLUME_HOME}/lib/guava-*.jar

WORKDIR ${FLUME_HOME}

ENTRYPOINT ["bin/flume-ng", "agent", \
    "--conf", "conf", \
    "--conf-file", "conf/flume.conf", \
    "--name", "agent", \
    "-Dflume.root.logger=INFO,console"]
