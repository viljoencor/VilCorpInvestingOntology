import yfinance as yf
from newsapi import NewsApiClient
import pandas as pd
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium import webdriver
from selenium.webdriver.chrome.service import Service

# Generic Input Configuration
class DataExtractor:
    def __init__(self, ticker=None, company=None, start_date=None, end_date=None):
        self.ticker = ticker
        self.company = company
        self.start_date = start_date
        self.end_date = end_date

    # Validate Inputs
    def validate_inputs(self):
        if not self.ticker and not self.company:
            raise ValueError("At least one of 'ticker' or 'company' must be provided.")
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must be before end date.")

# Stock Price Extraction
class StockPriceExtractor:
    def __init__(self, ticker=None, start_date=None, end_date=None):
        self.ticker = ticker
        self.start_date = start_date
        self.end_date = end_date

    def validate_inputs(self):
        if not self.ticker:
            raise ValueError("Ticker is required to fetch stock prices.")
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("Start date must be before end date.")

    def fetch_stock_prices(self):
        self.validate_inputs()

        stock = yf.Ticker(self.ticker)
        historical_data = stock.history(start=self.start_date, end=self.end_date)

        if historical_data.empty:
            print(f"No stock price data found for {self.ticker} between {self.start_date} and {self.end_date}.")
            return None

        print("Fetched Data Columns:", historical_data.columns)  # Debugging step

        # Reset index to make 'Date' a column and rename columns
        historical_data.reset_index(inplace=True)
        historical_data.rename(columns={"Date": "isRecordedOn", "Close": "priceValue", "Volume": "volume"}, inplace=True)
        return historical_data[["isRecordedOn", "priceValue", "volume"]]

# News Article Extraction using NewsAPI
class NewsAPIExtractor(DataExtractor):
    def __init__(self, api_key, company=None, start_date=None, end_date=None):
        super().__init__(company=company, start_date=start_date, end_date=end_date)
        self.newsapi = NewsApiClient(api_key=api_key)

    def fetch_news_articles(self):
        if not self.company:
            raise ValueError("Company name is required to fetch news articles.")

        articles = self.newsapi.get_everything(
            q=self.company,
            from_param=self.start_date,
            to=self.end_date,
            language="en",
            sort_by="relevancy",
        )
        news = [
            {
                "title": article["title"],
                "url": article["url"],
                "publicationDate": article.get("publishedAt"),
            }
            for article in articles["articles"]
        ]
        if not news:
            print(f"No news articles found for {self.company} between {self.start_date} and {self.end_date}.")
        return news

# Yahoo Finance Financial Data Scraper
class YahooFinanceExtractor:
    def __init__(self, driver_path):
        self.driver_path = driver_path

    def handle_cookie_banner(self, driver):
        """
        Handles the Yahoo cookie consent popup by clicking 'Reject all'.
        """
        try:
            # Wait for the cookie banner to appear
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Reject all')]"))
            )

            # Find the 'Accept all' button and click it
            accept_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Reject all')]")
            accept_button.click()
            print("Cookie banner accepted.")

        except TimeoutException:
            print("No cookie banner found. Proceeding with scraping...")
        except Exception as e:
            print(f"Error while handling cookie banner: {e}")

    def scrape_yahoo_financials(self, url):
        service = Service(self.driver_path)
        driver = webdriver.Chrome(service=service)

        try:
            print(f"Accessing {url}...")
            driver.get(url)

            # Handle cookie banner
            self.handle_cookie_banner(driver)

            # Wait for the financial table to load
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".tableContainer"))
            )

            # Continue with scraping...
            headers = ["Metric"]
            header_elements = driver.find_elements(By.CSS_SELECTOR, ".tableHeader .column")
            headers += [header.text.strip() for header in header_elements[1:]]
            
            rows = []
            row_elements = driver.find_elements(By.CSS_SELECTOR, ".tableBody .row")

            for row in row_elements:
                metric_name = row.find_element(By.CSS_SELECTOR, ".column.sticky .rowTitle").text.strip()
                values = [value.text.strip() for value in row.find_elements(By.CSS_SELECTOR, ".column:not(.sticky)")]
                if metric_name:
                    rows.append([metric_name] + values)

            driver.quit()

            if rows:
                df = pd.DataFrame(rows, columns=headers)
                df.set_index("Metric", inplace=True)
                return df
            else:
                raise Exception("No data rows found in the financial table.")

        except TimeoutException:
            driver.quit()
            raise Exception("Timeout while waiting for financial data to load.")
        except Exception as e:
            driver.quit()
            raise Exception(f"Failed to scrape financial data: {e}")

    def scrape_performance_overview(self, url):
        driver = webdriver.Chrome(service=Service(self.driver_path))
        try:
            print(f"Accessing {url} for performance overview...")
            driver.get(url)

            # Wait for the performance overview section to load
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "section[data-testid='performance-overview']"))
            )

            performance_section = driver.find_element(By.CSS_SELECTOR, "section[data-testid='performance-overview']")
            cards = performance_section.find_elements(By.CSS_SELECTOR, "section.card")

            performance_overview = {}
            for card in cards:
                title = card.find_element(By.CSS_SELECTOR, "h3.title").text
                values = card.find_elements(By.CSS_SELECTOR, "div.perf")
                returns = [value.text for value in values]

                # Map to the expected keys
                performance_overview[title] = {
                    "cpiReturn": returns[0].replace("%", ""),
                    "indexReturn": returns[1].replace("%", "")
                }

            driver.quit()
            return performance_overview
        except TimeoutException:
            driver.quit()
            raise Exception("Timeout while waiting for performance overview to load.")
        except Exception as e:
            driver.quit()
            raise Exception(f"Failed to scrape performance overview: {e}")

# Unified Function
def fetch_data(data_type, ticker=None, company=None, start_date=None, end_date=None, api_key=None, financials_url=None):
    extractor = YahooFinanceExtractor(driver_path="path/to/chromedriver")
    if data_type == "stock_prices":
        return StockPriceExtractor(ticker=ticker, start_date=start_date, end_date=end_date).fetch_stock_prices()
    elif data_type == "news":
        if not api_key:
            raise ValueError("API key is required for fetching news articles.")
        return NewsAPIExtractor(api_key=api_key, company=company, start_date=start_date, end_date=end_date).fetch_news_articles()
    elif data_type == "financials":
        if not financials_url:
            raise ValueError("Financials URL is required to fetch financial data.")
        return extractor.scrape_yahoo_financials(financials_url)
    elif data_type == "performance_overview":
        if not financials_url:
            raise ValueError("Performance overview URL is required.")
        return extractor.scrape_performance_overview(financials_url)
    else:
        raise ValueError("Invalid data type.")
