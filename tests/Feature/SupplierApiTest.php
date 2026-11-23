<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Organization;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $org = Organization::create([
            'name' => "Kaldi's Coffee",
            'currency' => 'ETB',
        ]);

        $this->admin = User::create([
            'organization_id' => $org->id,
            'name' => 'Admin Test',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
    }

    public function test_can_list_suppliers(): void
    {
        Supplier::create([
            'legal_name' => 'Abyssinia Coffee Traders PLC',
            'verification_status' => 'verified',
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/suppliers');

        $response->assertOk();
        $response->assertJsonFragment(['legalName' => 'Abyssinia Coffee Traders PLC']);
    }

    public function test_can_create_supplier_with_minimal_fields(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/suppliers', [
            'legalName' => 'Awash Agro Impex',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('suppliers', [
            'legal_name' => 'Awash Agro Impex',
            'verification_status' => 'unverified',
        ]);
    }

    public function test_can_manage_categories(): void
    {
        $create = $this->actingAs($this->admin)->postJson('/api/categories', [
            'name' => 'Packaging Materials',
        ]);
        $create->assertStatus(201);

        $catId = $create->json('id');

        $update = $this->actingAs($this->admin)->patchJson("/api/categories/{$catId}", [
            'name' => 'Packaging & Box Supplies',
        ]);
        $update->assertOk();

        $this->assertDatabaseHas('categories', ['name' => 'Packaging & Box Supplies']);
    }
}
