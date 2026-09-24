sudo docker buildx build --platform linux/amd64 -t koosoftware/anything-llm:ragmyai-v1.8.5.8 -f ./docker/Dockerfile .
sudo docker push koosoftware/anything-llm:ragmyai-v1.8.5.8

v1.8.5.8 (24-Sep-2026)
-----------------------
- Revert Gemini 2.5 Flash not to use reasoning_effort none
- Added max token to Azure OpenAI

v1.8.5.7 (24-Sep-2026)
-----------------------
- Set Gemini 2.5 Flash to use reasoning_effort none

v1.8.5.6 (24-Sep-2026)
-----------------------
- Added max token to Gemini

v1.8.5.5 (23-Sep-2026)
-----------------------
- Fix max token not working in AWS Bedrock Mantle

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