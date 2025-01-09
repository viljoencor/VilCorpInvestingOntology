import requests

def upload_rdf_to_fuseki(file_path, fuseki_url, dataset_name):
    """
    Uploads RDF data to an Apache Jena Fuseki server.

    Args:
        file_path (str): Path to the RDF file.
        fuseki_url (str): Base URL of the Fuseki server.
        dataset_name (str): Name of the dataset in Fuseki.

    Returns:
        None
    """
    # Ensure the URL is properly formatted
    endpoint_url = f"{fuseki_url}/{dataset_name}/data"
    
    headers = {'Content-Type': 'application/rdf+xml'}  # Adjust content type based on RDF format
    try:
        with open(file_path, 'rb') as data:
            response = requests.post(endpoint_url, data=data, headers=headers)
        
        # Handle the response
        if response.status_code == 200 or response.status_code == 204:
            print("Data uploaded successfully!")
        else:
            print("Failed to upload data:")
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Fuseki server: {e}")

# Example Usage
upload_rdf_to_fuseki("VilCorpInvestingOntology_data.rdf", "http://localhost:3030", "vilcorp_data")
