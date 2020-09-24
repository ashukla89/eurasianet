import pandas as pd
import numpy as np
import json

import datetime as dt

import time

import os
from git import Repo

yesterday = dt.date.today() - dt.timedelta(days = 1)
dates = pd.date_range(start='01-22-2020',end=yesterday)
dates = [date.strftime("%m-%d-%Y") for date in dates]

url = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/" 
countries = ['Azerbaijan','Armenia','Georgia','Kazakhstan','Uzbekistan','Kyrgyzstan','Turkmenistan','Tajikistan']
# lately, they've been using these column names
columns_later = ['Country_Region','Confirmed','Deaths','Recovered','Active']
# earlier on they were using these
columns_earlier = ['Country/Region','Confirmed','Deaths','Recovered']

df_master = pd.DataFrame()

for date in dates:
    print(date)
    url_date = url + str(date) + ".csv"
    df_daily = pd.read_csv(url_date)
    #first try the format that has predominated lately
    try:
        df_daily = df_daily[df_daily['Country_Region'].isin(countries)][columns_later]
    # otherwise use the older one, and rename the columns to match the current convention
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


###### reshape for Infogram-friendly json ######
# shape into Infogram-friendly format
df_cases = df_master.pivot_table(index='Date',columns='Country_Region',values='Confirmed',aggfunc='sum')
df_deaths = df_master.pivot_table(index='Date',columns='Country_Region',values='Deaths',aggfunc='sum')
df_since_7 = since_100.pivot_table(index='Date',columns='Country_Region',values='Confirmed_change_7day')
# subset for Georgia alone
df_ga_cases = df_cases['Georgia']
df_ga_deaths = df_deaths['Georgia']
df_ga_since_7 = df_since_7['Georgia']

# convert date column to string first
to_convert = {'Date': str}
# rewrite as three-level lists, since Infogram seems to want that for sheets
list_cases = df_cases.fillna(0).reset_index().astype(to_convert).T.reset_index().T.values.tolist()
list_deaths = df_deaths.fillna(0).reset_index().astype(to_convert).T.reset_index().T.values.tolist()
list_since_7 = df_since_7.fillna(0).round(0).reset_index().astype(to_convert).T.reset_index().T.values.tolist()
# subset for Georgia
list_ga_cases = df_ga_cases.fillna(0).reset_index().astype(to_convert).T.reset_index().T.values.tolist()
list_ga_deaths = df_ga_deaths.fillna(0).reset_index().astype(to_convert).T.reset_index().T.values.tolist()
list_ga_since_7 = df_ga_since_7.fillna(0).round(0).reset_index().astype(to_convert).T.reset_index().T.values.tolist()

# rename the first element so Infogram reads that as the sheet name
list_cases[0][0] = 'Cases'
list_deaths[0][0] = 'Deaths'
list_since_7[0][0] = 'New Cases, 7-Day Average'
# subset for Georgia
list_ga_cases[0][0] = 'Cases'
list_ga_deaths[0][0] = 'Deaths'
list_ga_since_7[0][0] = 'New Cases, 7-Day Average'

# put them all together into a master list
master_list = [list_cases,list_deaths,list_since_7]
# and georgia too, reordered per David
ga_list = [list_ga_since_7,list_ga_cases,list_ga_deaths]

# save as json
with open(path + 'all.json', 'w') as outfile:
    json.dump(master_list, outfile)
# and georgia too
with open(path + 'ga.json', 'w') as outfile:
    json.dump(ga_list, outfile)

import boto3
from botocore.exceptions import NoCredentialsError

def upload_to_aws(local_file, bucket, s3_file):
    s3 = boto3.client('s3')

    try:
        s3.upload_file(local_file, bucket, s3_file)
        print("Upload Successful")
        return True
    except FileNotFoundError:
        print("The file was not found")
        return False
    except NoCredentialsError:
        print("Credentials not available")
        return False


uploaded_all_csv = upload_to_aws('src/data/all.csv', 'eurasianet', 'all.csv')
uploaded_since_csv = upload_to_aws('src/data/since.csv', 'eurasianet', 'since.csv')
uploaded_all_json = upload_to_aws('src/data/all.json', 'eurasianet', 'all.json')
uploaded_ga_json = upload_to_aws('src/data/ga.json', 'eurasianet', 'ga.json')

# deprecated for site build

# # rebuild site
# os.system("npm run build")
# print("Website rebuild step")

# # push to github
# # first specify directory/ repo object
# working_tree_dir = '/Users/aseemshukla/Documents/MS_Data_Journalism/Eurasianet'
# repo = Repo(working_tree_dir)

# # perform git activities 
# repo.git.add(A=True)
# repo.git.commit('-m', 'daily commit')
# repo.git.push('origin', 'master')
# print("Update Github step")
        
