sudo docker buildx build --platform linux/amd64 -t koosoftware/anything-llm:ragmyai-v1.8.5.4 -f ./docker/Dockerfile .
sudo docker push koosoftware/anything-llm:ragmyai-v1.8.5.4


v1.8.5.4 (28-Aug-2026)
-----------------------
- Fix bedrock mantle path for Gemma 4 31B


v1.8.5.3 (28-Aug-2026)
------------------------
- Added bedrock mantle


v1.8.5.2
-----------
- Remove <thought> from Gemini API using gemma4
- Fix slow chat response when vector count not empty