import yfinance as yf
from newsapi import NewsApiClient
import pandas as pd

class StockPriceExtractor:
    def __init__(self, ticker, start_date, end_date):
        """
        Initializes the StockPriceExtractor with the required parameters.
        """
        self.ticker = ticker
        self.start_date = start_date
        self.end_date = end_date

    def validate_inputs(self):
        """
        Validates the inputs to ensure they are valid.
        """
        if not self.ticker:
            raise ValueError("Ticker is required to fetch stock prices.")
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must be before end date.")

    def fetch_stock_prices(self):
        """
        Fetches stock prices for the specified ticker and date range.
        """
        self.validate_inputs()

        stock = yf.Ticker(self.ticker)
        historical_data = stock.history(start=self.start_date, end=self.end_date)

        if historical_data.empty:
            raise ValueError(f"No stock price data found for ticker {self.ticker} between {self.start_date} and {self.end_date}.")

        # Reset index and rename columns to match expected format
        historical_data.reset_index(inplace=True)
        historical_data.rename(columns={"Date": "isRecordedOn", "Close": "priceValue", "Volume": "volume"}, inplace=True)

        # Return only the required columns
        return historical_data[["isRecordedOn", "priceValue", "volume"]]

class NewsAPIExtractor:
    def __init__(self, api_key, company, start_date, end_date):
        self.api_key = api_key
        self.company = company
        self.start_date = start_date
        self.end_date = end_date
        self.newsapi = NewsApiClient(api_key=self.api_key)

    def fetch_news_articles(self):
        articles = self.newsapi.get_everything(
            q=self.company,
            from_param=self.start_date,
            to=self.end_date,
            language="en",
            sort_by="relevancy",
        )
        return [
            {"title": article["title"], "url": article["url"], "publicationDate": article.get("publishedAt")}
            for article in articles["articles"]
        ]
