import pandas as pd
import numpy as np

import datetime as dt

import time

yesterday = dt.date.today() - dt.timedelta(days = 1)
dates = pd.date_range(start='01-22-2020',end=yesterday)
dates = [date.strftime("%m-%d-%Y") for date in dates]

url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/" 
countries = ['Azerbaijan','Armenia','Georgia','Kazakhstan','Uzbekistan','Kyrgyzstan','Turkmenistan','Tajikistan']
columns_later = ['Country_Region','Confirmed','Deaths','Recovered','Active']
columns_earlier = ['Country/Region','Confirmed','Deaths','Recovered']

df_master = pd.DataFrame()

for date in dates:
    print(date)
    url_date = url + str(date) + ".csv"
    df_daily = pd.read_csv(url_date)
    try:
        df_daily = df_daily[df_daily['Country_Region'].isin(countries)][columns_later]
    except:
        df_daily = df_daily[df_daily['Country/Region'].isin(countries)][columns_earlier]
        df_daily.rename({'Country/Region':'Country_Region'},axis=1,inplace=True)
        df_daily['Active'] = df_daily['Confirmed'] - (df_daily['Deaths'] + df_daily['Recovered'])
    df_daily['Date'] = date
    # convert to an actual date
    df_daily['Date'] = pd.to_datetime(df_daily.Date)
    # append to master df
    df_master = df_master.append(df_daily, ignore_index=True)
    
# compute number of days since 100 cases
# set start date
start_date = df_master[df_master.Confirmed >= 100].groupby('Country_Region').Date.min()
# Group them by name using .set_index,
# subtract the start date from each one of them,
# and then ungroup them with .reset_index
df_master['days_since_100'] = df_master.set_index('Country_Region', append=True).swaplevel().Date\
    .sub(start_date).reset_index(drop=True, level=0)
# We need to do .dt.days because otherwise it's a date object
# instead of an actual number of days
df_master['days_since_100'] = df_master.days_since_100.dt.days

df_master['Confirmed_change'] = df_master.sort_values(by='Date').groupby('Country_Region').Confirmed.diff(periods=1)
df_master['Confirmed_change_pct'] = df_master.sort_values(by='Date').groupby('Country_Region').Confirmed.pct_change(periods=1)

# filter to where days_since_100 is greater than 0
since_100 = df_master[df_master.days_since_100 >= 0]

# add rolling 7-day average by country to since
since_100_7 = since_100.groupby('Country_Region').rolling(window=7,on='Date')['Confirmed_change'].mean().reset_index()
since_100_7.rename({'Confirmed_change':'Confirmed_change_7day'},axis=1,inplace=True)
since_100 = since_100.merge(since_100_7,on=['Country_Region','Date'])

# save to csvs
path = 'src/data/'

df_master.to_csv(path + 'all.csv')
since_100.to_csv(path + 'since.csv')