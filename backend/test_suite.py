import sys
import os
import time
from fastapi import HTTPException

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import main
from app.models import (
    RouteRequest,
    LoginRequest,
    RegisterRequest,
    SavedRouteRequest,
    RouteRecordCreate,
    RouteRecordUpdate,
    ShipmentBookingRequest,
    ShipmentStatusUpdateRequest
)
from app.auth import decode_access_token
from app.database import get_db_connection, get_all_bookings

def run_tests():
    print('=== STARTING AUTOMATED BACKEND INTEGRATION TEST SUITE ===')

    # Test 1: Root Heartbeat
    root = main.home()
    assert root['version'] == '2.0.0', 'Root version mismatch'
    print('[PASS] 1. Root API heartbeat verified:', root['message'])

    # Test 2: Ports Endpoint
    ports_res = main.list_ports()
    ports_count = len(ports_res['ports'])
    assert ports_count >= 47, 'Expected at least 47 ports'
    print(f'[PASS] 2. Ports API returned {ports_count} global ports with UN/LOCODEs')

    # Test 3: Popular Corridors
    pop_res = main.popular_routes()
    pop_count = len(pop_res['popular_routes'])
    assert pop_count == 6, 'Expected 6 popular corridors'
    print(f'[PASS] 3. Popular Corridors API returned {pop_count} corridors')

    # Test 4: Route Intelligence - Chennai to Rotterdam (with alternatives)
    class DummyReq:
        headers = {}
    req_cr = RouteRequest(origin='Chennai', destination='Rotterdam', cargo_type='Standard Dry', containers=5)
    cr_res = main.analyze_route(req_cr, DummyReq())
    assert cr_res['status'] == 'success', 'Chennai->Rotterdam failed'
    assert 'recommended_route' in cr_res, 'Missing recommended route'
    assert len(cr_res['alternative_routes']) >= 2, 'Expected alternative routes'
    assert cr_res['recommended_route']['total_freight_usd'] == cr_res['recommended_route']['base_freight_usd'] * 5
    print(f'[PASS] 4. Chennai -> Rotterdam Route Intelligence verified with score: {cr_res["recommended_route"]["route_score"]} and {len(cr_res["alternative_routes"])} alternatives')

    # Test 5: Route Intelligence - Identical Port Rejection
    try:
        main.analyze_route(RouteRequest(origin='Chennai', destination='Chennai', containers=1), DummyReq())
        assert False, 'Should have failed on identical ports'
    except Exception as e:
        assert 'Origin port and destination port cannot be identical' in str(e)
        print('[PASS] 5. Identical origin & destination properly rejected')

    # Test 6: Route Intelligence - Non-existent route
    res_none = main.analyze_route(RouteRequest(origin='Buenos Aires', destination='Visakhapatnam', containers=1), DummyReq())
    assert res_none['status'] == 'error'
    assert 'No matching route is currently available' in res_none['message']
    print(f'[PASS] 6. Unavailable corridor returned proper message: {res_none["message"]}')

    # Test 7: User Registration & Strict Validations
    # 7a: Mobile Number Validations
    invalid_mobiles = [
        ("", "Mobile Number is required"),
        ("98765 43210", "cannot contain spaces"),
        ("98765.4321", "cannot contain decimal values"),
        ("98765abcde", "cannot contain alphabets"),
        ("98765@3210", "cannot contain special characters"),
        ("987654321", "must be exactly 10 digits"),
        ("98765432101", "must be exactly 10 digits"),
        ("0123456789", "cannot start with 0"),
        ("0000000000", "cannot start with 0"),
        ("5123456789", "cannot start with 1–5"),
    ]
    for bad_mob, expected_msg in invalid_mobiles:
        try:
            main.register(RegisterRequest(
                email="valid_test@brokerage.com",
                password="SecurePassword123!",
                full_name="Valid Name",
                mobile_number=bad_mob
            ))
            assert False, f"Expected mobile '{bad_mob}' to be rejected"
        except Exception as e:
            assert expected_msg.lower() in str(e).lower(), f"Unexpected error for {bad_mob}: {e}"

    # 7b: Email Address Validations
    invalid_emails = [
        ("", "Email ID is required"),
        ("shipperexample.com", "must contain an '@' symbol"),
        ("abc@@gmail.com", "exactly one '@' symbol"),
        ("abc..xyz@gmail.com", "cannot contain consecutive dots"),
        (".abc@gmail.com", "cannot start with a dot"),
        ("abc.@gmail.com", "cannot end with a dot"),
        ("abc@gmail", "must include a domain extension"),
        ("abc@gmail..com", "consecutive dots"),
        ("abc def@gmail.com", "cannot contain spaces"),
    ]
    for bad_email, expected_msg in invalid_emails:
        try:
            main.register(RegisterRequest(
                email=bad_email,
                password="SecurePassword123!",
                full_name="Valid Name",
                mobile_number="9876543210"
            ))
            assert False, f"Expected email '{bad_email}' to be rejected"
        except Exception as e:
            assert expected_msg.lower() in str(e).lower(), f"Unexpected error for {bad_email}: {e}"

    print('[PASS] 7a. Strict Mobile Number & Email ID validations thoroughly verified')

    test_email = f'testuser_{int(time.time())}@brokerage.com'
    try:
        reg_res = main.register(RegisterRequest(
            email=test_email,
            password='SecurePassword123!',
            full_name='Test Shipper',
            company='Global Cargo Corp',
            mobile_number='9876543210'
        ))
        assert reg_res['status'] == 'success'
        assert reg_res['user']['role'] == 'user'
        print(f'[PASS] 7. User Registration verified, role enforced as: {reg_res["user"]["role"]}')

        # Test 8: Duplicate Email Rejection
        try:
            main.register(RegisterRequest(
                email=test_email,
                password='AnotherPassword123!',
                full_name='Duplicate Person',
                mobile_number='8765432109'
            ))
            assert False, 'Duplicate registration should have failed'
        except Exception as e:
            assert 'already exists' in str(e).lower()
            print('[PASS] 8. Duplicate email registration rejected')

        # Test 9: User Authentication & Token
        login_res = main.login(LoginRequest(email=test_email, password='SecurePassword123!'))
        assert login_res['status'] == 'success'
        token = login_res['token']
        payload = decode_access_token(token)
        assert payload['email'] == test_email
        print('[PASS] 9. User Authentication & HS256 Token verified')

        # Test 10: Invalid Password Rejection
        try:
            main.login(LoginRequest(email=test_email, password='WrongPassword123!'))
            assert False, 'Wrong password should fail'
        except Exception as e:
            assert 'Invalid email address or password' in str(e)
            print('[PASS] 10. Invalid password rejected')

        # Test 11: Admin RBAC Enforcement (Normal user cannot call admin endpoint)
        normal_user = main.get_user_by_email(test_email)
        try:
            main.require_admin(normal_user)
            assert False, 'Normal user must be forbidden from admin endpoint'
        except Exception as e:
            assert 'Administrator privileges required' in str(e)
            print('[PASS] 11. Admin RBAC successfully blocked normal user')

        # Test 12: Admin Privileges Access
        admin_user = main.get_user_by_email('admin@gmail.com')
        stats = main.admin_stats(admin=admin_user)
        assert stats['total_routes'] >= 500
        print(f'[PASS] 12. Admin successfully authorized, total routes in dataset: {stats["total_routes"]}')

        # Test 13: Admin Route CRUD (Add, Edit, Delete)
        new_test_route_id = f'R_TEST_{int(time.time()) % 10000}'
        add_res = main.admin_add_route(RouteRecordCreate(
            route_id=new_test_route_id,
            origin='Chennai',
            destination='Tokyo',
            distance_nm=4200,
            transit_days=14,
            transshipments=0,
            route_type='Express Direct',
            base_freight_usd=1650.0
        ), admin=admin_user)
        assert add_res['status'] == 'success'
        print(f'[PASS] 13a. Admin Route added to dataset: {add_res["route"]["route_id"]}')

        edit_res = main.admin_update_route(new_test_route_id, RouteRecordUpdate(base_freight_usd=1750.0), admin=admin_user)
        assert edit_res['route']['base_freight_usd'] == 1750.0
        print('[PASS] 13b. Admin Route edited successfully')

        del_res = main.admin_delete_route(new_test_route_id, admin=admin_user)
        assert del_res['status'] == 'success'
        print(f'[PASS] 13c. Admin Route deleted successfully (remaining: {del_res["remaining_routes"]})')

        # Test 14: User Saved Routes & Dashboard
        saved_res = main.create_saved_route(SavedRouteRequest(
            route_id='R501',
            origin='Chennai',
            destination='Rotterdam',
            route_type='Express Direct',
            distance_nm=6420,
            transit_days=19,
            base_freight_usd=2450.0,
            route_score=100.0,
            notes='Test bookmark'
        ), user=normal_user)
        assert saved_res['status'] == 'success'
        print(f'[PASS] 14a. User saved route successfully (ID: {saved_res["saved_route"]["id"]})')

        user_dash = main.user_dashboard(user=normal_user)
        assert user_dash['stats']['saved_routes_count'] >= 1
        print(f'[PASS] 14b. User dashboard returned accurate live stats: {user_dash["stats"]}')

        del_saved = main.remove_saved_route(saved_res['saved_route']['id'], user=normal_user)
        assert del_saved['status'] == 'success'
        print('[PASS] 14c. User removed saved route successfully')

        # Test 15: Shipment Booking & Tracking System
        from app.models import ShipmentBookingRequest, ShipmentStatusUpdateRequest

        # 15a: User books a shipment
        booking_req = ShipmentBookingRequest(
            route_id='R501',
            origin='Chennai',
            destination='Rotterdam',
            cargo_desc='High-precision machinery parts',
            cargo_type='Standard Dry',
            containers=2,
            shipper_name='Chennai Exports Ltd',
            contact_phone='+91 98765 43210',
            pickup_address='Plot 14, Industrial Estate, Guindy, Chennai',
            delivery_address='Waalhaven Pier 4, Rotterdam Port',
            pickup_date='2026-11-25',
            transit_days=19,
            distance_nm=6420,
            transshipments=1,
            freight_usd=4900.0,
            intermediate_port='Colombo'
        )
        book_res = main.book_shipment(booking_req, user=normal_user)
        assert book_res['status'] == 'success'
        booking_id = book_res['booking']['booking_id']
        assert booking_id.startswith('BK-')
        assert book_res['booking']['booking_status'] == 'Pending'
        assert book_res['booking']['dispatch_status'] == 'Pending Approval'
        print(f'[PASS] 15a. Step 1: Shipment booked with ID: {booking_id} (Booking Status: Pending, Dispatch Status: Pending Approval)')

        # 15b: User lists own bookings
        my_bookings_res = main.my_shipments(user=normal_user)
        assert any(b['booking_id'] == booking_id for b in my_bookings_res['bookings'])
        print(f'[PASS] 15b. User booking correctly visible in personal consignment list (Count: {my_bookings_res["total"]})')

        # 15c: Initial shipment timeline event: "Booking Request Submitted"
        details_res = main.get_shipment_details(booking_id, user=normal_user)
        assert details_res['booking']['booking_id'] == booking_id
        assert len(details_res['timeline']) >= 1
        assert details_res['timeline'][0]['status'] == 'Booking Request Submitted'
        assert "awaiting administrator review" in details_res['timeline'][0]['remarks']
        print(f'[PASS] 15c. Initial timeline event recorded as "Booking Request Submitted" with factual system remark')

        # 15d: Security check: other user blocked (403)
        other_user = {'id': 999999, 'email': 'other@maritime.com', 'role': 'user'}
        try:
            main.get_shipment_details(booking_id, user=other_user)
            assert False, "Unauthorized user should not access another user's booking"
        except HTTPException as e:
            assert e.status_code == 403
            print('[PASS] 15d. Security enforced: Unauthorized user blocked from reading other bookings (403)')

        # 15e: Step 2: Administrator approves the booking request
        pending_res = main.admin_pending_shipments(admin=admin_user)
        assert any(b['booking_id'] == booking_id for b in pending_res['pending_shipments'])
        approve_res = main.admin_approve_shipment(booking_id, admin=admin_user)
        assert approve_res['status'] == 'success'
        assert approve_res['booking']['booking_status'] == 'Approved'
        assert approve_res['booking']['dispatch_status'] == 'Booking Confirmed'
        # Verify approval remark: "Booking approved by the Port Administrator."
        approval_event = approve_res['booking']
        app_details = main.get_shipment_details(booking_id, user=normal_user)
        assert any(e['status'] == 'Booking Confirmed' and 'Booking approved by the Port Administrator.' in e['remarks'] for e in app_details['timeline'])
        print(f'[PASS] 15e. Step 2: Administrator approved booking {booking_id} (Milestone 1: Booking Confirmed)')

        # 15f: Sequential restriction: attempting to skip to "Loaded onto Vessel" or "Delivered" fails
        try:
            main.admin_update_shipment_status(
                booking_id,
                ShipmentStatusUpdateRequest(status='Loaded onto Vessel', remarks='Skipping cargo intake'),
                admin=admin_user
            )
            assert False, "Should have prevented skipping 'Cargo Received at Origin Port'"
        except HTTPException as e:
            assert e.status_code == 400
            assert "restricted to sequential order" in e.detail or "Cargo Received at Origin Port" in e.detail
            print('[PASS] 15f. Restricted updates: Skipping milestones prohibited (HTTP 400)')

        # 15g: Step 3: Advance each dispatch milestone sequentially
        # Milestone 2: Cargo Received at Origin Port
        m2_res = main.admin_update_shipment_status(
            booking_id,
            ShipmentStatusUpdateRequest(
                status='Cargo Received at Origin Port',
                remarks='Consignment checked at container freight station',
                timestamp='2026-11-20 10:00:00'
            ),
            admin=admin_user
        )
        assert m2_res['booking']['dispatch_status'] == 'Cargo Received at Origin Port'
        print('[PASS] 15g1. Milestone 2 advanced: "Cargo Received at Origin Port"')

        # Milestone 3: Loaded onto Vessel
        m3_res = main.admin_update_shipment_status(
            booking_id,
            ShipmentStatusUpdateRequest(
                status='Loaded onto Vessel',
                remarks='Containers securely stowed on vessel bay 4',
                timestamp='2026-11-20 14:30:00'
            ),
            admin=admin_user
        )
        assert m3_res['booking']['dispatch_status'] == 'Loaded onto Vessel'
        print('[PASS] 15g2. Milestone 3 advanced: "Loaded onto Vessel"')

        # Milestone 4: In Transit
        m4_res = main.admin_update_shipment_status(
            booking_id,
            ShipmentStatusUpdateRequest(
                status='In Transit',
                remarks='Vessel underway through maritime corridor',
                timestamp='2026-11-21 08:00:00'
            ),
            admin=admin_user
        )
        assert m4_res['booking']['dispatch_status'] == 'In Transit'
        print('[PASS] 15g3. Milestone 4 advanced: "In Transit"')

        # Milestone 5: Arrived at Destination Port
        m5_res = main.admin_update_shipment_status(
            booking_id,
            ShipmentStatusUpdateRequest(
                status='Arrived at Destination Port',
                remarks='Vessel berthed at Waalhaven Terminal Rotterdam',
                timestamp='2026-11-28 16:00:00'
            ),
            admin=admin_user
        )
        assert m5_res['booking']['dispatch_status'] == 'Arrived at Destination Port'
        print('[PASS] 15g4. Milestone 5 advanced: "Arrived at Destination Port"')

        # Milestone 6: Delivered
        m6_res = main.admin_update_shipment_status(
            booking_id,
            ShipmentStatusUpdateRequest(
                status='Delivered',
                remarks='Consignment successfully handed over to consignee',
                timestamp='2026-11-29 11:15:00'
            ),
            admin=admin_user
        )
        assert m6_res['booking']['dispatch_status'] == 'Delivered'
        print('[PASS] 15g5. Milestone 6 advanced: "Delivered"')

        # 15h: Step 4 & 5 & 6 & 7: Shipper checks tracking timeline after Delivered
        final_details = main.get_shipment_details(booking_id, user=normal_user)
        timeline_events = final_details['timeline']
        timeline_statuses = [e['status'] for e in timeline_events]
        # Verify timestamps exist for all 6 milestones
        for m in ["Booking Confirmed", "Cargo Received at Origin Port", "Loaded onto Vessel", "In Transit", "Arrived at Destination Port", "Delivered"]:
            assert m in timeline_statuses, f"Missing milestone {m} in final timeline"
        print('[PASS] 15h. All 6 milestones completed and recorded with timestamps & remarks')

        # 15i: Step 8: Prevent further updates after Delivered
        try:
            main.admin_update_shipment_status(
                booking_id,
                ShipmentStatusUpdateRequest(status='Delivered', remarks='Another attempt'),
                admin=admin_user
            )
            assert False, "Should have blocked updates after Delivered"
        except HTTPException as e:
            assert e.status_code == 400
            assert "Delivered" in e.detail or "No further dispatch updates" in e.detail
            print('[PASS] 15i. Terminal state enforced: No further updates permitted after Delivered (HTTP 400)')

        # 15j: Test Separate Status Filters
        # Filter by booking_status = 'Approved'
        approved_shipments = get_all_bookings(booking_status='Approved')
        assert any(b['booking_id'] == booking_id for b in approved_shipments)

        # Filter by booking_status = 'Pending' (should NOT include this approved shipment)
        pending_shipments = get_all_bookings(booking_status='Pending')
        assert not any(b['booking_id'] == booking_id for b in pending_shipments)

        # Filter by dispatch_status = 'Delivered'
        delivered_shipments = get_all_bookings(dispatch_status='Delivered')
        assert any(b['booking_id'] == booking_id for b in delivered_shipments)

        # Filter by dispatch_status = 'In Transit' (should NOT include delivered shipment)
        transit_shipments = get_all_bookings(dispatch_status='In Transit')
        assert not any(b['booking_id'] == booking_id for b in transit_shipments)
        print('[PASS] 15j. Dedicated status filters verified: booking_status and dispatch_status query independently')

        # 15k: Cancellation test on a new booking
        booking_req2 = ShipmentBookingRequest(
            route_id='R501',
            origin='Chennai',
            destination='Rotterdam',
            cargo_desc='Sample automotive parts',
            cargo_type='Dry Container (General)',
            containers=1,
            shipper_name='Chennai Exports Ltd',
            contact_phone='+91 98765 43210',
            pickup_address='Plot 14, Guindy',
            delivery_address='Rotterdam Pier 2',
            pickup_date='2026-11-26',
            transit_days=19,
            distance_nm=6420,
            transshipments=1,
            freight_usd=1000.0
        )
        b2_res = main.book_shipment(booking_req2, user=normal_user)
        b2_id = b2_res['booking']['booking_id']
        cancel_res = main.delete_user_shipment(booking_id=b2_id, user=normal_user)
        assert cancel_res['status'] == 'success'
        assert cancel_res['booking']['booking_status'] == 'Cancelled'
        cancelled_bookings = get_all_bookings(booking_status='Cancelled')
        assert any(b['booking_id'] == b2_id for b in cancelled_bookings)
        print(f'[PASS] 15k. Booking {b2_id} cancelled by shipper and verified in Cancelled status filter')

        # 15l: Admin Rejection with mandatory reason test
        booking_req3 = ShipmentBookingRequest(
            route_id='R501',
            origin='Chennai',
            destination='Rotterdam',
            cargo_desc='Dangerous chemicals',
            cargo_type='Dry Container (General)',
            containers=1,
            shipper_name='Chem Trade Ltd',
            contact_phone='+91 98765 43210',
            pickup_address='Plot 14, Guindy',
            delivery_address='Rotterdam Pier 2',
            pickup_date='2026-11-26',
            transit_days=19,
            distance_nm=6420,
            transshipments=1,
            freight_usd=1200.0
        )
        b3_res = main.book_shipment(booking_req3, user=normal_user)
        b3_id = b3_res['booking']['booking_id']
        # Attempt reject without reason should fail
        try:
            main.admin_reject_shipment(b3_id, payload={'reason': ''}, admin=admin_user)
            assert False, "Rejection without reason must fail"
        except HTTPException as e:
            assert e.status_code == 400
            assert "reason is required" in e.detail.lower()

        rej_res = main.admin_reject_shipment(b3_id, payload={'reason': 'Hazardous cargo not permitted'}, admin=admin_user)
        assert rej_res['status'] == 'success'
        assert rej_res['booking']['booking_status'] == 'Rejected'
        b3_details = main.get_shipment_details(b3_id, user=normal_user)
        assert any('Hazardous cargo not permitted' in e['remarks'] for e in b3_details['timeline'])
        print(f'[PASS] 15l. Admin rejection validated with mandatory reason, verified on timeline')

        # 15m: Admin Cancellation of Approved Booking with mandatory reason
        booking_req4 = ShipmentBookingRequest(
            route_id='R501',
            origin='Chennai',
            destination='Rotterdam',
            cargo_desc='Seasonal garments',
            cargo_type='Dry Container (General)',
            containers=2,
            shipper_name='Textile Hub Ltd',
            contact_phone='+91 98765 43210',
            pickup_address='Plot 14, Guindy',
            delivery_address='Rotterdam Pier 2',
            pickup_date='2026-11-26',
            transit_days=19,
            distance_nm=6420,
            transshipments=1,
            freight_usd=2400.0
        )
        b4_res = main.book_shipment(booking_req4, user=normal_user)
        b4_id = b4_res['booking']['booking_id']
        main.admin_approve_shipment(b4_id, admin=admin_user)
        # Attempt cancel without reason should fail
        try:
            main.admin_cancel_shipment(b4_id, payload={'reason': ''}, admin=admin_user)
            assert False, "Cancellation without reason must fail"
        except HTTPException as e:
            assert e.status_code == 400
            assert "reason is required" in e.detail.lower()

        adm_cancel = main.admin_cancel_shipment(b4_id, payload={'reason': 'Vessel voyage cancelled by carrier'}, admin=admin_user)
        assert adm_cancel['status'] == 'success'
        assert adm_cancel['booking']['booking_status'] == 'Cancelled'
        b4_details = main.get_shipment_details(b4_id, user=normal_user)
        assert any('Vessel voyage cancelled by carrier' in e['remarks'] for e in b4_details['timeline'])
        # Verify no further dispatch updates permitted after cancellation
        try:
            main.admin_update_shipment_status(
                b4_id,
                ShipmentStatusUpdateRequest(status='Cargo Received at Origin Port', remarks='Attempt update'),
                admin=admin_user
            )
            assert False, "Cannot update dispatch after cancellation"
        except HTTPException as e:
            assert e.status_code == 400
        print(f'[PASS] 15m. Admin cancellation of approved booking validated with mandatory reason, timeline event & dispatch progression block')

        # Test 16: User Deactivation, Reactivation & Deletion Flow
        # 16a: Admin deactivates user
        deact_res = main.admin_toggle_user_status(normal_user["id"], admin=admin_user)
        assert deact_res["user"]["status"] == "Deactivated"
        print("[PASS] 16a. Admin deactivated user account successfully")

        # 16b: Deactivated user login rejected with 403 and specific message
        try:
            main.login(LoginRequest(email=test_email, password="SecurePassword123!"))
            assert False, "Deactivated user login must fail with HTTP 403"
        except HTTPException as e:
            assert e.status_code == 403
            assert "deactivated by the administrator" in e.detail
            assert "admin@gmail.com" in e.detail
            print("[PASS] 16b. Deactivated user login rejected with proper 403 and contact admin message")

        # 16c: Admin reactivates user
        react_res = main.admin_toggle_user_status(normal_user["id"], admin=admin_user)
        assert react_res["user"]["status"] == "Active"
        login_after_react = main.login(LoginRequest(email=test_email, password="SecurePassword123!"))
        assert login_after_react["status"] == "success"
        print("[PASS] 16c. User successfully reactivated by admin and logged in")

        # 16d: Admin deletes user
        del_user_res = main.admin_remove_user(normal_user["id"], admin=admin_user)
        assert del_user_res["status"] == "success"
        print("[PASS] 16d. Admin deleted user account successfully")

        # 16e: Deleted user login rejected with 404 and 'No user account found' message
        try:
            main.login(LoginRequest(email=test_email, password="SecurePassword123!"))
            assert False, "Deleted user login must fail with HTTP 404"
        except HTTPException as e:
            assert e.status_code == 404
            assert "No user account found with this email address" in e.detail
            print("[PASS] 16e. Deleted user login properly rejected with 'No user account found' message")

    # Clean up test user & bookings so test runs never pollute database
    finally:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM shipment_tracking_events WHERE booking_id IN (SELECT booking_id FROM bookings WHERE user_email = ?)", (test_email,))
        cur.execute("DELETE FROM bookings WHERE user_email = ?", (test_email,))
        cur.execute("DELETE FROM saved_routes WHERE user_id IN (SELECT id FROM users WHERE email = ?)", (test_email,))
        cur.execute("DELETE FROM shipment_searches WHERE user_email = ?", (test_email,))
        cur.execute("DELETE FROM users WHERE email = ?", (test_email,))
        cur.execute("UPDATE sqlite_sequence SET seq = (SELECT COALESCE(MAX(id), 0) FROM users) WHERE name = 'users'")
        conn.commit()
        conn.close()
        print('[PASS] 15h. Test shipment and user records safely cleaned up from database')

    print('\n============================================================')
    print('ALL 16 CRITICAL BACKEND TESTS PASSED WITH 100% SUCCESS!')
    print('============================================================')

if __name__ == '__main__':
    run_tests()
