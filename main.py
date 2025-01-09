from data_etl_pipeline.data_extraction import fetch_data, YahooFinanceExtractor
from data_etl_pipeline.data_cleaning import clean_stock_prices, clean_news_articles
from data_etl_pipeline.data_transformation import create_rdf_graph

def main():
    # Configuration
    company_name = "Capitec Bank"
    ticker = "CPI.JO"
    start_date = "2024-11-12"
    end_date = "2024-11-30"
    financials_url = "https://finance.yahoo.com/quote/CPI.JO/financials/"
    performance_url = "https://finance.yahoo.com/quote/CPI.JO/"
    api_key = "d745b20dc64046fb9e52cc8e407427b2"
    driver_path = "C:/chromedriver-win64/chromedriver.exe"  # Update this path

    try:
        # Step 1: Fetch Stock Prices
        print("Fetching stock prices...")
        raw_stock_data = fetch_data("stock_prices", ticker=ticker, start_date=start_date, end_date=end_date)
        if raw_stock_data is not None:
            cleaned_stock_data = clean_stock_prices(raw_stock_data)
            print(f"Stock Prices:\n{cleaned_stock_data.head()}")
        else:
            print("No stock price data available.")

        # Step 2: Fetch News Articles
        print("Fetching news articles...")
        raw_news_data = fetch_data("news", company=company_name, start_date=start_date, end_date=end_date, api_key=api_key)
        cleaned_news_data = clean_news_articles(raw_news_data, company_name)
        print(f"News Articles: {[article['title'] for article in cleaned_news_data]}")

        # Step 3: Scrape Financial Statements
        print("Scraping financial statements...")
        yahoo_extractor = YahooFinanceExtractor(driver_path=driver_path)
        financial_data_df = yahoo_extractor.scrape_yahoo_financials(financials_url)

        if not financial_data_df.empty:
            print("Financial Data:\n", financial_data_df)
        else:
            print("Financial Data is empty. Please check the page structure or network issues.")

        # Step 4: Scrape Performance Overview
        print("Scraping performance overview...")
        performance_data = yahoo_extractor.scrape_performance_overview(performance_url)
        if performance_data:
            print("Performance Overview Data:")
            for period, values in performance_data.items():
                # Use explicit keys for 'CPI.JO Return' and 'All Share Index Return'
                cpi_return = values.get('CPI.JO Return', 'N/A')
                index_return = values.get('All Share Index Return', 'N/A')
                print(f"{period}: CPI.JO = {cpi_return}, All Share Index = {index_return}")
        else:
            print("No performance overview data available.")


        # Step 5: Calculate Financial Metrics
        print("Calculating financial metrics...")
        eps = float(financial_data_df.loc["Basic EPS", "TTM"].replace(",", ""))
        net_income = float(financial_data_df.loc["Net Income Common Stockholders", "TTM"].replace(",", ""))
        equity = float(financial_data_df.loc["Normalized Income", "TTM"].replace(",", ""))
        financial_metrics = [
            {"metricName": "PE Ratio", "metricValue": cleaned_stock_data["priceValue"].iloc[-1] / eps, "metricUnit": ""},
            {"metricName": "ROE", "metricValue": (net_income / equity) * 100, "metricUnit": "%"},
        ]
        print(f"Financial Metrics:\n{financial_metrics}")

        # Step 6: Convert to RDF and Save
        print("Creating RDF graph...")
        rdf_graph = create_rdf_graph(
            cleaned_stock_data,
            cleaned_news_data,
            financial_metrics,
            performance_data,
            company_name
        )
        rdf_graph.serialize("VilCorpInvestingOntology_data.rdf", format="xml")
        print("RDF data has been saved to VilCorpInvestingOntology_data.rdf.")


    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()
