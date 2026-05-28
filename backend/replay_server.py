

import asyncio, math, random

async def stream_telemetry(websocket_send_fn, stop_event: asyncio.Event):
    print("[Replay] Starting Monaco synthetic telemetry...")

    lap_number        = 1
    t                 = 0
    gap_ahead         = 3.5
    gap_behind        = 4.2
    tyre_wear_tracker = 100.0
    engine_temp       = 94.0
    brake_temp_fl     = 280.0
    brake_temp_fr     = 308.0
    gear_temp         = 78.0
    ers_battery       = 44.0
    fuel_load         = 61.0

    # New fields
    brake_temp_rl     = 260.0
    brake_temp_rr     = 275.0
    tyre_temp_fl      = 88.0
    tyre_temp_fr      = 86.0
    tyre_temp_rl      = 92.0
    tyre_temp_rr      = 90.0
    suspension_fl     = 0.0
    suspension_fr     = 0.0
    suspension_rl     = 0.0
    suspension_rr     = 0.0
    mgu_k_deploy      = 60.0
    mgu_k_harvest     = 30.0

    NORMAL = "RACING"
    SAFETY = "SAFETY CAR"
    PIT    = "PIT STOP"
    YELLOW = "YELLOW FLAG"

    event_state   = NORMAL
    event_timer   = 0
    next_event_at = 300

    # Sector deltas — update once per lap
    sector_delta_s1 = round(random.uniform(-0.3, 0.5), 3)
    sector_delta_s2 = round(random.uniform(-0.2, 0.4), 3)
    sector_delta_s3 = round(random.uniform(-0.4, 0.3), 3)
    last_lap_delta_update = 0

    while not stop_event.is_set():

        # ── Race event logic
        if t >= next_event_at and event_state == NORMAL:
            event_state = random.choice([SAFETY, PIT, YELLOW])
            event_timer = 0
            print(f"[Replay] Race event: {event_state}")

        if event_state != NORMAL:
            event_timer += 1
            durations = {SAFETY: 120, PIT: 30, YELLOW: 60}
            if event_timer >= durations[event_state]:
                print(f"[Replay] {event_state} ended.")
                event_state   = NORMAL
                next_event_at = t + random.randint(200, 400)

        gap_ahead  = max(0.2, min(8.0, gap_ahead  + (random.random() - 0.48) * 0.25))
        gap_behind = max(0.2, min(8.0, gap_behind + (random.random() - 0.48) * 0.25))

        progress = (t % 800) / 800
        angle    = progress * 2 * math.pi

        # ── Car physics
        if event_state == SAFETY:
            speed = int(70 + 10 * math.sin(angle * 2))
            brake = int(max(0, 15 * abs(math.sin(angle * 3))))
            throttle = int(60 + 10 * math.sin(angle))
            gear = 3

        elif event_state == PIT:
            pit_p = event_timer / 30
            if pit_p < 0.3:
                speed=int(80*(1-pit_p)); brake=30; throttle=0; gear=2
            elif pit_p < 0.6:
                speed=0; brake=100; throttle=0; gear=1
            else:
                speed=int(60*(pit_p-0.6)*4); brake=0
                throttle=int(80*(pit_p-0.6)*4); gear=2

        elif event_state == YELLOW:
            speed = int(120 + 40 * abs(math.sin(angle * 3)))
            brake = int(max(0, 20 * abs(math.sin(angle * 3))))
            throttle = int(50 + 20 * math.sin(angle))
            gear = 4

        else:
            base_speed   = 160 + 120 * abs(math.sin(angle * 3))
            speed        = int(min(320, max(60, base_speed + 20 * math.sin(angle * 7))))
            speed_change = math.sin(angle * 3 + 0.5)
            if speed_change < -0.1:
                brake    = int(max(0, min(100, -speed_change * 120)))
                throttle = 0
            else:
                brake    = 0
                throttle = int(max(0, min(100, 100 - 20 * abs(math.sin(angle * 5)))))

            if   speed < 80:  gear = 1
            elif speed < 120: gear = 2
            elif speed < 160: gear = 3
            elif speed < 200: gear = 4
            elif speed < 240: gear = 5
            elif speed < 280: gear = 6
            elif speed < 310: gear = 7
            else:             gear = 8

        # ── Tyre wear
        if event_state == NORMAL:
            tyre_wear_tracker -= 0.015
            if brake > 70:  tyre_wear_tracker -= 0.02
            if speed > 280: tyre_wear_tracker -= 0.01
        elif event_state == PIT:
            tyre_wear_tracker = 100.0

        tyre_life = int(max(0, tyre_wear_tracker))

        # ── Temperatures
        engine_temp   = round(min(115, max(88,  engine_temp   + random.uniform(-0.3, 0.4))), 1)
        gear_temp     = round(min(95,  max(70,  gear_temp     + random.uniform(-0.2, 0.3))), 1)

        # F1 brakes cool rapidly on straights due to airflow
        cooling = (speed / 100) * 2.5 if brake == 0 else 0
        brake_heat = brake * 0.5

        brake_temp_fl = round(min(850, max(150, brake_temp_fl + brake_heat - cooling + random.uniform(-2, 2))), 1)
        brake_temp_fr = round(min(850, max(150, brake_temp_fr + brake_heat - cooling + random.uniform(-2, 2))), 1)
        brake_temp_rl = round(min(850, max(150, brake_temp_rl + (brake_heat * 0.6) - cooling + random.uniform(-2, 2))), 1)
        brake_temp_rr = round(min(850, max(150, brake_temp_rr + (brake_heat * 0.6) - cooling + random.uniform(-2, 2))), 1)

        # Tyre surface temps — rise with speed and braking
        tyre_heat     = (speed / 320) * 0.05 + (brake / 100) * 0.08
        tyre_temp_fl  = round(min(130, max(70, tyre_temp_fl + random.uniform(-0.5, tyre_heat * 2))), 1)
        tyre_temp_fr  = round(min(130, max(70, tyre_temp_fr + random.uniform(-0.5, tyre_heat * 2))), 1)
        tyre_temp_rl  = round(min(130, max(70, tyre_temp_rl + random.uniform(-0.3, tyre_heat * 1.5))), 1)
        tyre_temp_rr  = round(min(130, max(70, tyre_temp_rr + random.uniform(-0.3, tyre_heat * 1.5))), 1)
        if event_state == PIT:
            tyre_temp_fl = tyre_temp_fr = tyre_temp_rl = tyre_temp_rr = 75.0

        # ── ERS and fuel
        if event_state == NORMAL:
            ers_battery   = round(max(0, min(100, ers_battery - 0.02 + random.uniform(-0.05, 0.08))), 1)
            fuel_load     = round(max(0, fuel_load - 0.008), 2)
            mgu_k_deploy  = round(min(160, max(0, throttle * 1.2 + random.uniform(-5, 5))), 1)
            mgu_k_harvest = round(min(80,  max(0, brake * 0.8  + random.uniform(-3, 3))), 1)
        elif event_state == PIT:
            ers_battery   = round(min(100, ers_battery + 0.5), 1)
            mgu_k_deploy  = 0.0
            mgu_k_harvest = 0.0

        # ── Suspension travel (mm) — simulates bumps and cornering load
        suspension_fl = round(math.sin(angle * 6) * 15 + random.uniform(-2, 2), 1)
        suspension_fr = round(math.sin(angle * 6 + 0.3) * 15 + random.uniform(-2, 2), 1)
        suspension_rl = round(math.sin(angle * 5) * 12 + random.uniform(-1, 1), 1)
        suspension_rr = round(math.sin(angle * 5 + 0.3) * 12 + random.uniform(-1, 1), 1)

        # ── Derived dynamics for Lap Intelligence
        steering_angle   = round(math.sin(angle * 4) * 180 * (1 - throttle / 200), 1)
        g_lateral        = round(math.sin(angle * 3) * 4.5 * (speed / 320), 2)
        g_longitudinal   = round((brake * -0.04) + (throttle * 0.015), 2)

        # ── Sector deltas — update each new lap
        if lap_number != last_lap_delta_update:
            sector_delta_s1 = round(random.uniform(-0.3, 0.5), 3)
            sector_delta_s2 = round(random.uniform(-0.2, 0.4), 3)
            sector_delta_s3 = round(random.uniform(-0.4, 0.3), 3)
            last_lap_delta_update = lap_number

        # ── Position
        x      = round(0.5 + 0.45 * math.cos(angle), 4)
        y      = round(0.5 + 0.45 * math.sin(angle), 4)
        sector = 1 if progress < 0.33 else (2 if progress < 0.66 else 3)

        if t > 0 and t % 800 == 0:
            lap_number += 1
            print(f"[Replay] Lap {lap_number}")

        progress_ver = (progress + (gap_ahead * 0.01)) % 1.0
        progress_lec = (progress - (gap_behind * 0.01)) % 1.0

        frame = {
            # ── Core telemetry
            "speed":        speed,
            "brake":        brake,
            "throttle":     throttle,
            "n_gear":       gear,
            "x":            x,
            "y":            y,
            "lap":          lap_number,
            "sector":       sector,
            "drs":          1 if speed > 250 and brake == 0 else 0,
            "race_status":  event_state,
            "gap_ahead":    round(gap_ahead, 3),
            "gap_behind":   round(gap_behind, 3),
            "in_battle":    gap_ahead < 1.0 or gap_behind < 1.0,
            "tyre_life":    tyre_life,
            "progress":     round(progress, 4),

            # ── Lap distance (Monaco = 3337m)
            "lap_distance": round(progress * 3337, 1),


            "traffic": [
                {"id": "VER", "progress": round(progress_ver, 4)},
                {"id": "LEC", "progress": round(progress_lec, 4)}
              ],

            # ── Derived dynamics (Lap Intelligence)
            "steering_angle":   steering_angle,
            "g_lateral":        g_lateral,
            "g_longitudinal":   g_longitudinal,
            "sector_delta_s1":  sector_delta_s1,
            "sector_delta_s2":  sector_delta_s2,
            "sector_delta_s3":  sector_delta_s3,

            # ── Temperatures
            "engine_temp":    engine_temp,
            "brake_temp_fl":  brake_temp_fl,
            "brake_temp_fr":  brake_temp_fr,
            "brake_temp_rl":  brake_temp_rl,
            "brake_temp_rr":  brake_temp_rr,
            "tyre_temp_fl":   tyre_temp_fl,
            "tyre_temp_fr":   tyre_temp_fr,
            "tyre_temp_rl":   tyre_temp_rl,
            "tyre_temp_rr":   tyre_temp_rr,
            "gear_temp":      gear_temp,

            # ── Energy & fuel
            "ers_battery":    ers_battery,
            "fuel_load":      round(fuel_load, 1),
            "mgu_k_deploy":   mgu_k_deploy,
            "mgu_k_harvest":  mgu_k_harvest,

            # ── Chassis
            "suspension_fl":  suspension_fl,
            "suspension_fr":  suspension_fr,
            "suspension_rl":  suspension_rl,
            "suspension_rr":  suspension_rr,
        }

        await websocket_send_fn(frame)
        await asyncio.sleep(0.1)
        t += 1
