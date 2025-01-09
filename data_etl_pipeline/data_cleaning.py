import pandas as pd
from textblob import TextBlob

def clean_stock_prices(stock_data):
    """
    Cleans the stock price data by handling missing values or transformations.
    """
    if stock_data is None or stock_data.empty:
        raise ValueError("No stock price data to clean.")

    # Ensure the data has the required columns
    required_columns = ["isRecordedOn", "priceValue", "volume"]
    for col in required_columns:
        if col not in stock_data.columns:
            raise ValueError(f"Missing column in stock data: {col}")
    
    # Example cleaning: remove NaNs and ensure correct types
    stock_data.dropna(inplace=True)
    stock_data["priceValue"] = stock_data["priceValue"].astype(float)
    stock_data["volume"] = stock_data["volume"].astype(int)
    stock_data["isRecordedOn"] = pd.to_datetime(stock_data["isRecordedOn"])

    return stock_data

def clean_news_articles(news_data, company_name):
    """
    Cleans news article data and adds the mentionsCompany relationship and sentiment analysis.
    """
    if not news_data:
        return []

    unique_articles = {article['title']: article for article in news_data}
    for article in unique_articles.values():
        article['title'] = article['title'].strip()
        article['mentionsCompany'] = company_name if company_name.lower() in article['title'].lower() else None
        # Add sentiment score
        article['sentimentScore'] = TextBlob(article['title']).sentiment.polarity
    return list(unique_articles.values())
