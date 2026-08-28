sudo docker buildx build --platform linux/amd64 -t koosoftware/anything-llm:ragmyai-v1.8.5.3 -f ./docker/Dockerfile .
sudo docker push koosoftware/anything-llm:ragmyai-v1.8.5.3


v1.8.5.3 (28-Aug-2026)
------------------------
- Added bedrock mantle


v1.8.5.2
-----------
- Remove <thought> from Gemini API using gemma4
- Fix slow chat response when vector count not empty