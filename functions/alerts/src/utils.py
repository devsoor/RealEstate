import datetime
import dateutil.tz
import logging
import pytz

def ts_now():
    return datetime.datetime.utcnow().replace(tzinfo=dateutil.tz.tzutc())

def ts_now_pst():
    timezone = pytz.timezone("America/Los_Angeles")
    d = datetime.datetime.utcnow()
    d = timezone.localize(d)
    return d

weekdays = {
    0: 'MON', 1:'TUE', 2: 'WED', 3:'THU',4:'FRI',5:'SAT', 6:'SUN'
}
def weekday_pst():
    now = ts_now_pst()
    day_int = now.weekday()
    return weekdays[day_int]

def dt_to_ts(dt):
    if not isinstance(dt, datetime.datetime):
        logging.warning('Expected datetime, got %s' % (type(dt)))
        return dt
    ts = dt.isoformat()
    # Round microseconds to milliseconds
    if dt.tzinfo is None:
        # Implicitly convert local times to UTC
        return ts + 'Z'
    # isoformat() uses microsecond accuracy and timezone offsets
    # but we should try to use millisecond accuracy and Z to indicate UTC
    return ts.replace('000+00:00', 'Z').replace('+00:00', 'Z')

def get_user_attribute(attributes, name):
    val = [x['Value'] for x in attributes if x['Name'] == name]
    val = val[0] if val else None
    return val
    