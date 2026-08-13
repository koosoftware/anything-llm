sudo docker buildx build --platform linux/amd64 -t koosoftware/anything-llm:ragmyai-v1.8.5.2 -f ./docker/Dockerfile .
sudo docker push koosoftware/anything-llm:ragmyai-v1.8.5.2


v1.8.5.2
-----------
- Remove <thought> from Gemini API using gemma4
- Fix slow chat response when vector count not empty