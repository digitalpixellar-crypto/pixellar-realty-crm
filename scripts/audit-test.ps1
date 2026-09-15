$base = 'https://www.pixellarrealty.com'

function Test-EP {
    param($name, $method, $path, $body)
    try {
        if ($body) {
            $r = Invoke-WebRequest -Uri "$base$path" -Method $method -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 15
        } else {
            $r = Invoke-WebRequest -Uri "$base$path" -Method $method -UseBasicParsing -TimeoutSec 15
        }
        Write-Host "[PASS] $name : HTTP $($r.StatusCode)"
    } catch {
        Write-Host "[FAIL] $name : $($_.Exception.Message)"
    }
}

Test-EP 'Landing Page' 'GET' '/' $null
Test-EP 'Login Page' 'GET' '/login' $null
Test-EP 'Platform Admin Dashboard' 'GET' '/platform/dashboard' $null
Test-EP 'Tenant Dashboard (Skyline)' 'GET' '/app/skyline-developers/dashboard' $null
Test-EP 'Leads Page' 'GET' '/app/skyline-developers/leads' $null
Test-EP 'Inventory Master Layout' 'GET' '/app/skyline-developers/inventory' $null
Test-EP 'Bookings Page' 'GET' '/app/skyline-developers/bookings' $null
Test-EP 'Payments Page' 'GET' '/app/skyline-developers/payments' $null
Test-EP 'Reports Page' 'GET' '/app/skyline-developers/reports' $null
Test-EP 'Settings / Team Page' 'GET' '/app/skyline-developers/settings' $null
Test-EP 'Tenant Dashboard (Greenfield)' 'GET' '/app/greenfield-estates/dashboard' $null
Test-EP 'API Admin Login' 'POST' '/api/auth/login' '{"email":"digitalpixellar@gmail.com","password":"PixellarAdmin2026!"}'
Test-EP 'API Tenant Login' 'POST' '/api/auth/login' '{"email":"vikram@skylinedev.com","password":"any"}'
Test-EP 'API Send Magic Link' 'POST' '/api/auth/send-magic-link' '{"email":"digitalpixellar@gmail.com"}'
Test-EP 'API Unit Hold' 'POST' '/api/v1/units/hold' '{"unit_id":"unit-sk-hgt-1202","company_id":"comp-skyline-01","member_id":"mem-vikram-01","notes":"Audit Hold Test"}'
Test-EP 'API Unit Book' 'POST' '/api/v1/units/book' '{"unit_id":"unit-sk-mdw-103","company_id":"comp-skyline-01","customer_name":"Test Buyer","customer_phone":"+919876543210","sales_member_id":"mem-vikram-01","booking_amount":50000}'
Test-EP 'API Resend Diagnostics' 'GET' '/api/diagnostics/resend' $null
Test-EP 'API Inbound Lead' 'POST' '/api/v1/inbound-lead' '{"company_id":"comp-skyline-01","first_name":"Audit","last_name":"Tester","phone":"+919888877777","source":"website","project_id":"proj-sk-meadows"}'
