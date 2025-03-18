import yfinance as yf
from newsapi import NewsApiClient
import pandas as pd

class StockPriceExtractor:
    def __init__(self, ticker, start_date, end_date):
        """Initializes the StockPriceExtractor."""
        self.ticker = ticker
        self.start_date = start_date
        self.end_date = end_date

    def validate_inputs(self):
        """Validates inputs to ensure they are valid."""
        if not self.ticker:
            raise ValueError("Ticker is required to fetch stock prices.")
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must be before end date.")

    def fetch_stock_prices(self, period="1y"):
        """Fetches stock prices and ensures output is always a DataFrame."""
        try:
            stock = yf.Ticker(self.ticker)
            historical_data = stock.history(period=period)

            #  Check if data is empty
            if historical_data.empty:
                print(f"⚠️ No stock price data found for {self.ticker}. Returning empty DataFrame.")
                return pd.DataFrame(columns=["isRecordedOn", "priceValue", "volume"])

            #  Ensure DataFrame format
            historical_data.reset_index(inplace=True)
            historical_data.rename(columns={"Date": "isRecordedOn", "Close": "priceValue", "Volume": "volume"}, inplace=True)

            return historical_data[["isRecordedOn", "priceValue", "volume"]]

        except Exception as e:
            print(f"ERROR fetching stock prices for {self.ticker}: {e}")
            return pd.DataFrame(columns=["isRecordedOn", "priceValue", "volume"])  #  Always return DataFrame

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

class YahooFinanceExtractor:
    def __init__(self, ticker):
        self.ticker = ticker
        self.stock = yf.Ticker(ticker)

    def fetch_financial_metrics(self):
        try:
            financial_data = self.stock.get_info()
            return {
                "PE Ratio": financial_data.get("forwardPE"),
                "EPS": financial_data.get("trailingEps"),
                "Market Cap": financial_data.get("marketCap"),
                "Revenue": financial_data.get("totalRevenue"),
                "Profit Margin": financial_data.get("profitMargins"),
            }
        except Exception as e:
            print(f"Error fetching financial metrics: {e}")
            return {}  # Return an empty dictionary if an error occurs

    def fetch_performance_overview(self):
        try:
            # Fetch historical data for the last 10 years
            historical_data = self.stock.history(period="max")

            if historical_data.empty:
                raise ValueError(f"No historical data found for {self.ticker}.")

            # Ensure the index is a datetime type
            historical_data.index = pd.to_datetime(historical_data.index)

            # Define relevant dates
            today = historical_data.index[-1]  # Most recent trading day
            one_year_ago = today - pd.DateOffset(years=1)
            two_years_ago = today - pd.DateOffset(years=2)
            three_years_ago = today - pd.DateOffset(years=3)
            five_years_ago = today - pd.DateOffset(years=5)
            ten_years_ago = today - pd.DateOffset(years=10)

            # Helper function to find the closest available date
            def get_nearest_date(target_date):
                available_dates = historical_data.index[historical_data.index <= target_date]
                return available_dates[-1] if not available_dates.empty else None

            # Helper function to calculate return safely
            def calculate_return(start_date, end_date):
                try:
                    valid_start_date = get_nearest_date(start_date)
                    valid_end_date = get_nearest_date(end_date)

                    if valid_start_date is None or valid_end_date is None:
                        return "Data Not Available"

                    start_price = historical_data.loc[valid_start_date, "Close"]
                    end_price = historical_data.loc[valid_end_date, "Close"]
                    return round(((end_price - start_price) / start_price) * 100, 2)
                except Exception:
                    return "Data Not Available"

            # Calculate returns
            returns = {
                "1-Year Return": calculate_return(one_year_ago, today),
                "2-Year Return": calculate_return(two_years_ago, today),
                "3-Year Return": calculate_return(three_years_ago, today),
                "5-Year Return": calculate_return(five_years_ago, today),
                "10-Year Return": calculate_return(ten_years_ago, today)
            }

            return returns

        except Exception as e:
            print(f"Error calculating performance overview: {e}")
            return {}

    def calculate_ytd_return(self, historical_data):

        """
        Calculate the Year-To-Date (YTD) return.
        """
        historical_data["Date"] = historical_data.index
        historical_data["Year"] = historical_data["Date"].dt.year

        current_year = historical_data.iloc[-1]["Year"]
        ytd_data = historical_data[historical_data["Year"] == current_year]
        if ytd_data.empty:
            return None

        start_price = ytd_data.iloc[0]["Close"]
        end_price = ytd_data.iloc[-1]["Close"]
        return round(((end_price - start_price) / start_price) * 100, 2)
    
    def fetch_financial_statistics(self):
        """
        Fetches financial highlights, profitability metrics, and balance sheet data for a stock.
        """
        try:
            # Get the statistics from the Ticker object's `info` attribute
            info = self.stock.info

            # Extract relevant metrics
            statistics = {
                "Profitability and Income Statement": {
                    "Profit Margin": info.get("profitMargins", None),
                    "Return on Assets (ttm)": info.get("returnOnAssets", None),
                    "Return on Equity (ttm)": info.get("returnOnEquity", None),
                    "Revenue (ttm)": info.get("totalRevenue", None),
                    "Net Income Avi to Common (ttm)": info.get("netIncomeToCommon", None),
                    "Diluted EPS (ttm)": info.get("trailingEps", None),
                },
                "Balance Sheet and Cash Flow": {
                    "Total Cash (mrq)": info.get("totalCash", None),
                    "Total Debt/Equity (mrq)": info.get("debtToEquity", None),
                    "Levered Free Cash Flow (ttm)": info.get("freeCashflow", None),
                },
            }

            # Convert numbers to readable formats (e.g., billions or percentages)
            def format_number(value):
                if value is None:
                    return "N/A"
                elif isinstance(value, (int, float)):
                    if value > 1e9:
                        return f"{value / 1e9:.2f}B"  # Format as billions
                    elif value > 1e6:
                        return f"{value / 1e6:.2f}M"  # Format as millions
                    elif 0 < value < 1:
                        return f"{value * 100:.2f}%"  # Format as a percentage
                    return f"{value:.2f}"
                return value

            # Format all numeric values
            for section in statistics:
                for key in statistics[section]:
                    statistics[section][key] = format_number(statistics[section][key])

            return statistics
        except Exception as e:
            print(f"Error fetching financial statistics for {self.ticker}: {e}")
        return {}