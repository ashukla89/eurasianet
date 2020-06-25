# import pandas as pd
# import datetime as dt

# yesterday = dt.date.today() - dt.timedelta(days = 1)
# yesterday = yesterday.strftime("%m-%d-%Y")
# url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/" 
# url_date = url + str(yesterday) + ".csv"

# print(url_date)

# df_daily = pd.read_csv(url_date)
# df_daily['Date'] = yesterday

# df_daily.to_csv('test_df.csv')

import numpy as np

print(np.sum([5,10]))