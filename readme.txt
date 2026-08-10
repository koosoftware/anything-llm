v1.14.1.x pg branch
------------------
sudo docker buildx build --platform linux/amd64 -t koosoftware/anything-llm:ragmyai-v1.14.1.3 -f ./docker/Dockerfile .
sudo docker push koosoftware/anything-llm:ragmyai-v1.14.1.3

v1.14.1.3
-----------
- Remove <thought> from Gemini API using gemma4

v1.14.1.2
------------
- Remove <thought> from Gemini API using gemma4 (FAILED)

v1.14.1.1
-----------
- Remove <think> from GROQ API using GPT-OSS-20B

v1.14.1
---------
- First customization