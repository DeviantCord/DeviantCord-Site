# prod-deviantcord
Prod-DeviantCord, is the project that houses the new DeviantCord 4 website, as well as the overhauled documentation.
The site will also house the blog for DeviantCord. The site is powered by the Docusaurus, and is served by a FastAPI
server running uvicorn. 

Python is being used in the backend to allow for analytic tracking with Kafka, combined with InfluxDB for historical
traffic tracking. The aim for Kafka is to track which pages
are getting the most attention. 

Like prod-dls, this project is being hosted on Platform.sh to act as a test project utilizing Kafka that will be used in
production.  This project will eventually be using the Generic Container type. 
