import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import main
from app.models import (
    RouteRequest,
    LoginRequest,
    RegisterRequest,
    SavedRouteRequest,
    RouteRecordCreate,
    RouteRecordUpdate
)
from app.auth import decode_access_token
from app.database import get_db_connection

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

    # Test 7: User Registration
    test_email = f'testuser_{int(time.time())}@brokerage.com'
    reg_res = main.register(RegisterRequest(email=test_email, password='SecurePassword123!', full_name='Test Shipper', company='Global Cargo Corp'))
    assert reg_res['status'] == 'success'
    assert reg_res['user']['role'] == 'user'
    print(f'[PASS] 7. User Registration verified, role enforced as: {reg_res["user"]["role"]}')

    # Test 8: Duplicate Email Rejection
    try:
        main.register(RegisterRequest(email=test_email, password='AnotherPassword123!', full_name='Duplicate Person'))
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
    admin_user = main.get_user_by_email('admin@maritime.com')
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

    # Clean up test user so test runs never pollute the registered users directory
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM saved_routes WHERE user_id = ?", (normal_user['id'],))
    cur.execute("DELETE FROM shipment_searches WHERE user_id = ?", (normal_user['id'],))
    cur.execute("DELETE FROM users WHERE id = ?", (normal_user['id'],))
    conn.commit()
    conn.close()
    print('[PASS] 14d. Test user safely cleaned up from database')

    print('\n============================================================')
    print('ALL 14 CRITICAL BACKEND TESTS PASSED WITH 100% SUCCESS!')
    print('============================================================')

if __name__ == '__main__':
    run_tests()
