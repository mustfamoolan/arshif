<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed default Admin user
        $admin = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'المدير العام',
                'username' => 'admin',
                'email' => 'admin@alhadi.com',
                'role' => 'admin',
                'status' => 'active',
                'password' => Hash::make('admin123'),
            ]
        );

        // Seed default Employee user
        $employee = User::updateOrCreate(
            ['username' => 'employee'],
            [
                'name' => 'موظف التجارة',
                'username' => 'employee',
                'email' => 'employee@alhadi.com',
                'role' => 'employee',
                'status' => 'active',
                'password' => Hash::make('12345678'),
            ]
        );

        // Define realistic lists for Iraqi Arabic mock data
        $firstNames = ['أحمد', 'محمد', 'علي', 'حسن', 'حسين', 'مصطفى', 'عبد الله', 'سيف', 'عمر', 'خالد', 'كرار', 'جعفر', 'مهدي', 'مرتضى', 'ياسر', 'سجاد', 'عباس', 'ليث', 'زيد', 'أمير'];
        $fatherNames = ['عادل', 'سليم', 'هادي', 'جبار', 'صالح', 'حميد', 'كريم', 'جاسم', 'عبيد', 'محسن', 'سعد', 'سعدون', 'رعد', 'طارق', 'حامد', 'فاخر', 'راضي', 'نعيم', 'نعمة', 'كاظم'];
        $familyNames = ['التميمي', 'الخفاجي', 'الجبوري', 'العامري', 'الحلفي', 'الساعدي', 'اللامي', 'الدراجي', 'البهادلي', 'الياسري', 'الربيعي', 'العبيدي', 'الشمري', 'المياحي', 'السوداني'];
        $commPrefix = ['أسواق', 'سوبرماركت', 'محل', 'ميني ماركت', 'مكتب مواد غذائية', 'كشك الطيبين', 'سوبر ماركت النخبة'];
        
        $areas = ['الكرادة', 'الجادرية', 'الدورة', 'المنصور', 'اليرموك', 'الشعب', 'البنوك', 'القاهرة', 'زيونة', 'الغدير', 'الزعفرانية', 'الكاظمية', 'الأعظمية', 'الحارثية', 'السيدية'];
        $trustOptions = ['براد رند', 'براد ارسي', 'براد فينو', 'براد لايون', 'مجمدة ابو جنه', 'ستاند'];
        $signOptions = ['لافتة ضوئية فليكس', 'لافتة اكريليك مضيئة', 'لافتة عادية فليكس', 'لا يوجد'];

        // Seed 200 diverse customer profiles
        for ($i = 1; $i <= 200; $i++) {
            $firstName = $firstNames[array_rand($firstNames)];
            $fatherName = $fatherNames[array_rand($fatherNames)];
            $familyName = $familyNames[array_rand($familyNames)];
            $fullName = "$firstName $fatherName $familyName";

            $comm = $commPrefix[array_rand($commPrefix)] . " " . $firstName . " " . ($i % 3 === 0 ? 'التجارية' : ($i % 5 === 0 ? 'الحديثة' : 'للأغذية'));
            
            $area = $areas[array_rand($areas)];
            
            // Random GPS points in Baghdad (around lat 33.25 to 33.35, lng 44.30 to 44.40)
            $lat = 33.25 + (mt_rand(0, 10000) / 100000);
            $lng = 44.30 + (mt_rand(0, 10000) / 100000);

            // Random trust items list
            $trustItems = [];
            $numItems = mt_rand(1, 3);
            $shuffled = $trustOptions;
            shuffle($shuffled);
            for ($k = 0; $k < $numItems; $k++) {
                $trustItems[] = $shuffled[$k];
            }

            Customer::create([
                'full_name' => $fullName . " (" . $i . ")",
                'commercial_name' => $comm,
                'latitude' => $lat,
                'longitude' => $lng,
                'location_address' => "بغداد، {$area}، شارع رقم " . mt_rand(1, 50),
                'is_main_street' => mt_rand(0, 1) === 1,
                'is_side_street' => mt_rand(0, 1) === 1,
                'inside_residential_complex' => mt_rand(0, 1) === 1,
                'inside_residential_area' => mt_rand(0, 1) === 1,
                'nearest_landmark' => "قرب " . ($i % 2 === 0 ? 'مستوصف المنطقة' : 'جامع التوبة'),
                'customer_area' => $area,
                'estimated_area' => ['10_30', '30_80', '80_plus'][mt_rand(0, 2)],
                'trust_items' => $trustItems,
                'trust_code' => 'TR-' . mt_rand(1000, 9999),
                'sign_type' => $signOptions[array_rand($signOptions)],
                'phone' => '07' . mt_rand(700000000, 799999999),
                'refrigerator_photo' => null,
                'status' => mt_rand(0, 4) === 0 ? 'inactive' : 'active',
                'classification' => ['A', 'B', 'C'][mt_rand(0, 2)],
                'created_by' => mt_rand(0, 1) === 1 ? $admin->id : $employee->id,
            ]);
        }
    }
}
