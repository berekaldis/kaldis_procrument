<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProformaRequestApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $org = Organization::create([
            'name' => "Kaldi's Coffee",
            'currency' => 'ETB',
        ]);

        $this->admin = User::create([
            'organization_id' => $org->id,
            'name' => 'Procurement Admin',
            'email' => 'admin@kaldicoffee.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        $this->supplier = Supplier::create([
            'legal_name' => 'Sidama Green Coffee Exporters',
            'verification_status' => 'verified',
        ]);
    }

    public function test_can_create_proforma_request_with_items_and_suppliers(): void
    {
        $payload = [
            'title' => 'Grade 1 Washed Sidama Beans',
            'description' => 'Delivery to Addis central roastery warehouse',
            'paymentType' => 'credit',
            'creditPeriod' => 60,
            'items' => [
                [
                    'itemName' => 'Washed Sidama G1 60kg Sacks',
                    'description' => 'Moisture < 11.5%',
                    'quantity' => 100,
                    'unit' => 'sacks',
                ],
            ],
            'supplierIds' => [$this->supplier->id],
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/proforma-requests', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('proforma_requests', [
            'title' => 'Grade 1 Washed Sidama Beans',
            'payment_type' => 'credit',
            'credit_period' => 60,
            'status' => 'draft',
        ]);
        $this->assertDatabaseHas('proforma_request_items', [
            'item_name' => 'Washed Sidama G1 60kg Sacks',
            'quantity' => 100,
        ]);
        $this->assertDatabaseHas('proforma_request_suppliers', [
            'supplier_id' => $this->supplier->id,
            'status' => 'pending',
        ]);
    }
}
