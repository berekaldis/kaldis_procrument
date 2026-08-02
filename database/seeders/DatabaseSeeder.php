<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Notification;
use App\Models\Organization;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::firstOrCreate(
            ['name' => "Kaldi's Coffee PLC"],
            [
                'tin' => '0001234567',
                'address' => 'Bole Road, Addis Ababa, Ethiopia',
                'currency' => 'ETB',
                'approval_threshold' => 100000,
            ],
        );

        $users = [
            ['name' => 'Aster Girmay', 'email' => 'admin@kaldisbunna.et', 'password' => 'admin123', 'role' => 'admin'],
            ['name' => 'Selam Bekele', 'email' => 'selam@kaldisbunna.et', 'password' => 'purchaser123', 'role' => 'purchaser'],
            ['name' => 'Bereket Lemma', 'email' => 'finance@kaldisbunna.et', 'password' => 'finance123', 'role' => 'finance'],
            ['name' => 'Hana Tesfaye', 'email' => 'requester@kaldisbunna.et', 'password' => 'requester123', 'role' => 'requester'],
        ];

        foreach ($users as $u) {
            User::firstOrCreate(
                ['email' => $u['email']],
                array_merge($u, [
                    'organization_id' => $org->id,
                    'password' => Hash::make($u['password']),
                    'active' => true,
                ]),
            );
        }

        $categories = ['Coffee', 'Food', 'Supplies', 'Cleaning', 'Packaging', 'Equipment',
                       'Uniforms', 'Office', 'Maintenance', 'Raw Materials', 'Dairy', 'Fresh'];
        foreach ($categories as $name) {
            Category::firstOrCreate([
                'organization_id' => $org->id,
                'name' => $name,
            ]);
        }

        $suppliers = [
            ['legal_name' => 'Biftu Coffee Exporters PLC', 'trade_name' => 'Biftu Coffee',
             'verification_status' => 'verified', 'tin' => '0001111222', 'category_tags' => 'Coffee, Raw Materials',
             'contact_name' => 'Dawit Tadesse', 'contact_phone' => '+251911223344', 'contact_email' => 'sales@biftucoffee.et',
             'payment_terms' => '50% advance, 50% on delivery'],
            ['legal_name' => 'Addis Agro-Inputs Ltd', 'trade_name' => 'Addis Agro',
             'verification_status' => 'verified', 'tin' => '0002222333', 'category_tags' => 'Supplies, Raw Materials',
             'contact_name' => 'Marta Haile', 'contact_phone' => '+251911556677', 'contact_email' => 'info@addisagro.et',
             'payment_terms' => 'Net 30'],
            ['legal_name' => 'Sunrise Packaging Solutions', 'trade_name' => 'Sunrise Pack',
             'verification_status' => 'documents_received', 'tin' => '0003333444', 'category_tags' => 'Packaging',
             'contact_name' => 'Yonas Girma', 'contact_phone' => '+251911778899', 'contact_email' => 'sales@sunrisepack.et'],
            ['legal_name' => 'Highland Dairy Farms Co-op', 'trade_name' => 'Highland Dairy',
             'verification_status' => 'verified', 'tin' => '0004444555', 'category_tags' => 'Dairy, Food',
             'contact_name' => 'Selamawit Bekele', 'contact_phone' => '+251912334455', 'contact_email' => 'office@highlanddairy.et'],
            ['legal_name' => 'Mercato Equipment Trading', 'trade_name' => 'Mercato Equip',
             'verification_status' => 'unverified', 'tin' => '0005555666', 'category_tags' => 'Equipment, Maintenance',
             'contact_name' => 'Girmay Kebede', 'contact_phone' => '+251913445566', 'contact_email' => 'sales@mercatoequip.et'],
            ['legal_name' => 'Green Leaf Stationery Suppliers', 'trade_name' => 'Green Leaf',
             'verification_status' => 'verified', 'tin' => '0006666777', 'category_tags' => 'Office, Supplies',
             'contact_name' => 'Tigist Alemu', 'contact_phone' => '+251914556677', 'contact_email' => 'orders@greenleaf.et'],
            ['legal_name' => 'Selam Uniforms & Textiles', 'trade_name' => 'Selam Uniforms',
             'verification_status' => 'documents_received', 'tin' => '0007777888', 'category_tags' => 'Uniforms',
             'contact_name' => 'Abel Tesfaye', 'contact_phone' => '+251915667788', 'contact_email' => 'info@selamuniforms.et'],
        ];

        foreach ($suppliers as $s) {
            Supplier::firstOrCreate(
                ['organization_id' => $org->id, 'legal_name' => $s['legal_name']],
                array_merge($s, [
                    'organization_id' => $org->id,
                    'active' => true,
                ]),
            );
        }

        Notification::firstOrCreate(
            ['title' => 'Welcome to Kaldi Procurement', 'message' => 'The demo database has been seeded. Try logging in with one of the demo accounts.'],
            ['type' => 'info', 'read' => false],
        );
    }
}
