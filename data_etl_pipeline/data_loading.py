import requests

def upload_rdf_to_fuseki(file_path, fuseki_url, dataset_name):
    endpoint_url = f"{fuseki_url}/{dataset_name}/data"
    headers = {'Content-Type': 'application/rdf+xml'}
    try:
        with open(file_path, 'rb') as data:
            response = requests.post(endpoint_url, data=data, headers=headers)
        if response.status_code in [200, 204]:
            print("Data uploaded successfully!")
        else:
            print(f"Upload failed: {response.status_code}\n{response.text}")
    except Exception as e:
        print(f"Error: {e}")
