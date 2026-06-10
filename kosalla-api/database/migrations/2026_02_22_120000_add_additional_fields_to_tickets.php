<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('tickets', 'version')) {
                $table->string('version', 100)->nullable();
            }
            if (!Schema::hasColumn('tickets', 'build_no')) {
                $table->string('build_no', 100)->nullable();
            }
            if (!Schema::hasColumn('tickets', 'patch_no')) {
                $table->string('patch_no', 100)->nullable();
            }
            if (!Schema::hasColumn('tickets', 'module')) {
                $table->string('module', 150)->nullable();
            }
            if (!Schema::hasColumn('tickets', 'error_code')) {
                $table->string('error_code', 100)->nullable();
            }

            if (!Schema::hasColumn('tickets', 'severity')) {
                $table->string('severity', 50)->nullable();
            }
            if (!Schema::hasColumn('tickets', 'project')) {
                $table->string('project', 150)->nullable();
            }
            if (!Schema::hasColumn('tickets', 'customer')) {
                $table->string('customer', 150)->nullable();
            }

            if (!Schema::hasColumn('tickets', 'complete_ps')) {
                $table->boolean('complete_ps')->nullable();
            }
            if (!Schema::hasColumn('tickets', 'schedule_comment')) {
                $table->string('schedule_comment', 255)->nullable();
            }
        });
    }

    public function down(): void
    {
        $cols = [
            'version',
            'build_no',
            'patch_no',
            'module',
            'error_code',
            'severity',
            'project',
            'customer',
            'complete_ps',
            'schedule_comment',
        ];

        $existing = array_values(array_filter($cols, fn ($c) => Schema::hasColumn('tickets', $c)));

        if (!empty($existing)) {
            Schema::table('tickets', function (Blueprint $table) use ($existing) {
                $table->dropColumn($existing);
            });
        }
    }
};
