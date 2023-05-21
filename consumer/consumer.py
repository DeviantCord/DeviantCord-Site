from fastapi import FastAPI
from platformshconfig import Config
from kafka import KafkaConsumer

app = FastAPI()
config = Config()
credentials = config.credentials('analytics_streams')
kafka_server = '{}:{}'.format(credentials['host'], credentials['port'])
consumer = KafkaConsumer('my-topic',
                         group_id='my-group',
                         bootstrap_servers=kafka_server)
testing = True
while testing:
    print("todo")


