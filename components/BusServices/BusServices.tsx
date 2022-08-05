import styles from './BusServices.module.scss';
import { BusArrivalEndpointDataType, BusServiceNoAndArrival, LTABusStops } from '../../types/buses';
import { Grid, GridItem, Input, Text } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { fetchBusData, fetchBusStopDesc, parseTime } from '../../library/busservices';

const BusServices = () => {
  const [loadStates, setLoadStates] = useState<{ isDescLoaded: boolean; isTimeLoaded: boolean }>({
    isDescLoaded: false,
    isTimeLoaded: false,
  });
  const [busStopArr, setBusStopArr] = useState<LTABusStops[]>([]);
  const [busStopCode, setBusStopCode] = useState<string>('');
  const [busStopDesc, setBusStopDesc] = useState<string>('');
  const [serviceNo, setServiceNo] = useState<string>('');
  const [isInvalidCode, setIsInvalidCode] = useState<boolean>(false);
  const [arrivalTimings, setArrivalTimings] = useState<BusServiceNoAndArrival[]>([]);

  const isLoaded = useMemo(() => loadStates.isDescLoaded && loadStates.isTimeLoaded, [loadStates]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.target.value.length === 5) {
        setIsInvalidCode(false);
        setLoadStates({ ...loadStates, isTimeLoaded: false });
        setBusStopCode(e.target.value);
      } else {
        setBusStopCode('');
        setIsInvalidCode(true);
      }
    }
  };

  useEffect(() => {
    fetchBusStopDesc()
      .then((res) => {
        setBusStopArr(res);
      })
      .finally(() => {
        setLoadStates({ ...loadStates, isDescLoaded: true });
      });
  }, []);

  useEffect(() => {
    if (loadStates.isDescLoaded) {
      const filteredBusStop: LTABusStops[] = busStopArr.filter((busStop) => {
        return busStop.BusStopCode === busStopCode;
      });
      const desc = filteredBusStop[0]?.Description ?? '';
      setBusStopDesc(desc);
    }
  }, [busStopCode, isLoaded]);

  useEffect(() => {
    fetchBusData(busStopCode, serviceNo)
      .then((res) => {
        const busServices: BusArrivalEndpointDataType['Services'] = res.data;

        if (busServices?.[0]?.NextBus) {
          const busServiceTimings = busServices.map((data) => {
            return {
              ServiceNo: data.ServiceNo,
              ArrivalTimeInMins: parseTime(data.NextBus.EstimatedArrival),
            };
          });

          busServiceTimings.sort((a, b) => {
            return +a.ServiceNo - +b.ServiceNo;
          });
          setArrivalTimings(busServiceTimings);
        } else {
          setArrivalTimings([]);
        }
      })
      .finally(() => {
        setLoadStates({ ...loadStates, isTimeLoaded: true });
      });
  }, [busStopCode, serviceNo]);

  const renderTimings = () => {
    if (!loadStates.isDescLoaded) {
      return <Text fontSize="3xl">Loading...</Text>;
    } else {
      return busStopCode === '' ? (
        <div></div>
      ) : loadStates.isTimeLoaded ? (
        <div className={styles.body}>
          <Grid gap={4} templateColumns="repeat(1, 1fr)">
            <Grid templateColumns="repeat(7, 1fr)">
              <GridItem className={styles.header_container} colSpan={5}>
                <Text className={styles.header_title}>Bus No.</Text>
              </GridItem>
              <GridItem className={styles.header_container} colSpan={2}>
                <Text className={styles.header_title}>Arrival</Text>
              </GridItem>
            </Grid>
          </Grid>
          {arrivalTimings.length === 0 ? (
            <Text fontSize="4xl">No buses available</Text>
          ) : (
            arrivalTimings.map((timing) => {
              return (
                <Grid key={timing.ServiceNo} templateColumns="repeat(7, 1fr)">
                  <GridItem className={styles.bus_no_container} colSpan={5}>
                    <Text className={styles.bus_no}>{timing.ServiceNo}</Text>
                  </GridItem>
                  <GridItem className={styles.arr_time_container} colSpan={2}>
                    <Text className={styles.arr_time}>
                      {timing.ArrivalTimeInMins < 0
                        ? 'Left'
                        : timing.ArrivalTimeInMins === 0
                        ? 'Arr'
                        : timing.ArrivalTimeInMins}
                    </Text>
                  </GridItem>
                </Grid>
              );
            })
          )}
        </div>
      ) : (
        <Text fontSize="3xl">Loading bus timing...</Text>
      );
    }
  };

  return (
    <div className={styles.main}>
      <Input
        className={styles.input_bus_stop_code}
        isInvalid={isInvalidCode}
        errorBorderColor="red.500"
        focusBorderColor={isInvalidCode ? 'red.500' : 'blue.500'}
        placeholder={isInvalidCode ? 'Invalid bus stop number' : 'Please enter a bus stop number'}
        size="m"
        onKeyDown={handleKeyDown}
      />
      <Text className={styles.bus_stop_desc} fontSize="3xl">
        {busStopDesc}
      </Text>
      {renderTimings()}
    </div>
  );
};

export default BusServices;
