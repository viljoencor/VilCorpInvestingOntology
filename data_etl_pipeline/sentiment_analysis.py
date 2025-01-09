import pandas as pd
from textblob import TextBlob
import matplotlib.pyplot as plt

# Sentiment Analysis on News Articles
def analyze_sentiments(news_data):
    """
    Analyzes sentiments of news articles using TextBlob.
    Adds sentiment polarity and subjectivity to each article.
    """
    for article in news_data:
        analysis = TextBlob(article['title'])
        article['sentiment_polarity'] = analysis.sentiment.polarity
        article['sentiment_subjectivity'] = analysis.sentiment.subjectivity

    # Create a DataFrame for aggregated sentiment analysis
    sentiment_df = pd.DataFrame(news_data)

    # Ensure publicationDate exists
    if 'publicationDate' not in sentiment_df.columns or sentiment_df['publicationDate'].isnull().all():
        raise ValueError("No valid 'publicationDate' found in news articles.")

    # Convert publicationDate to datetime
    sentiment_df['publicationDate'] = pd.to_datetime(sentiment_df['publicationDate'])

    # Select only numeric columns for aggregation
    numeric_cols = ['sentiment_polarity', 'sentiment_subjectivity']
    daily_sentiment = (
        sentiment_df.groupby('publicationDate')[numeric_cols]
        .mean()
        .reset_index()
        .set_index('publicationDate')
    )
    return daily_sentiment

# Function to analyze stock price trends
def analyze_stock_trends(stock_data):
    """
    Calculates daily percentage changes in stock prices.
    """
    stock_data['PercentChange'] = stock_data['Close'].pct_change() * 100
    return stock_data

# Function to visualize correlations between sentiment and stock trends
def visualize_correlations(stock_data, sentiment_data):
    """
    Visualizes stock price trends and sentiment analysis correlations.
    """
    # Merge stock data and sentiment data on dates
    merged_data = stock_data.merge(sentiment_data, left_index=True, right_index=True, how='inner')

    # Plot stock price trends vs sentiment polarity
    fig, ax1 = plt.subplots()

    ax1.set_xlabel('Date')
    ax1.set_ylabel('Stock Price Change (%)', color='blue')
    ax1.plot(merged_data.index, merged_data['PercentChange'], color='blue', label='Stock % Change')
    ax1.tick_params(axis='y', labelcolor='blue')

    ax2 = ax1.twinx()
    ax2.set_ylabel('Sentiment Polarity', color='orange')
    ax2.plot(merged_data.index, merged_data['sentiment_polarity'], color='orange', label='Sentiment Polarity')
    ax2.tick_params(axis='y', labelcolor='orange')

    fig.tight_layout()
    plt.title("Correlation Between Stock Price Trends and Sentiment")
    plt.legend(loc="upper left")
    plt.show()

# Example usage
if __name__ == "__main__":
    # Load cleaned data
    stock_data = pd.read_csv("cleaned_stock_prices.csv", index_col=0, parse_dates=True)
    with open("cleaned_news_articles.json", "r") as f:
        import json
        news_data = json.load(f)

    # Perform sentiment analysis on news articles
    if news_data:
        sentiment_data = analyze_sentiments(news_data)
        print("\nSentiment Analysis (Daily Averages):")
        print(sentiment_data)
    else:
        print("No news data for sentiment analysis.")
        sentiment_data = pd.DataFrame()

    # Analyze stock price trends
    if not stock_data.empty:
        stock_data = analyze_stock_trends(stock_data)
        print("\nStock Price Trends:")
        print(stock_data[['Close', 'PercentChange']])
    else:
        print("No stock data for trend analysis.")

    # Visualize correlations if both datasets are available
    if not stock_data.empty and not sentiment_data.empty:
        visualize_correlations(stock_data, sentiment_data)
