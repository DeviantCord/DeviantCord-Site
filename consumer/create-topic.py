from kafka.admin import KafkaAdminClient, NewTopic

print("Please input a new topic name")
new_topic = input()

partitions:int = input("Please Input the amount of partitions")

admin_client = KafkaAdminClient(
    bootstrap_servers="localhost:9092",
    client_id='test'
)

topic_list = []
topic_list.append(NewTopic(name=new_topic, num_partitions=partitions))
admin_client.create_topics(new_topics=topic_list, validate_only=False)