<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\TeamManagementController;
use App\Http\Controllers\Api\UserRoleController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\OrganizationTeamController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\TicketStatusController;
use App\Http\Controllers\Api\TicketCommentController;
use App\Http\Controllers\Api\ProductTypeController;
use App\Http\Controllers\Api\InventoryItemController;
use App\Http\Controllers\Api\TeamGroupController;
use App\Http\Controllers\Api\TeamMemberController;
use App\Http\Controllers\Api\EngineerController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\MasterRoleController;
use App\Http\Controllers\Api\MasterProductController;
use App\Http\Controllers\Api\PortalTicketController;
use App\Http\Controllers\Api\TicketAttachmentController;
use App\Http\Controllers\Api\TicketCloseController;
use App\Http\Controllers\Api\PortalKbController;
use App\Http\Controllers\Api\PortalPopupController;

// ✅ Announcements
use App\Http\Controllers\Api\AdminAnnouncementController;
use App\Http\Controllers\Api\PortalAnnouncementController;

// ✅ User Articles
use App\Http\Controllers\Api\AdminUserArticleReviewerController;
use App\Http\Controllers\Api\PortalUserArticleController;
use App\Http\Controllers\Api\PortalUserArticleReviewController;
use App\Http\Controllers\Api\AdminUserArticleAccessController;

/**
 * ✅ CORS preflight handler (fix 405 for PUT on many shared host / proxy)
 * Must be BEFORE auth middleware.
 */
Route::options('{any}', function (Request $request) {
    return response()->noContent();
})->where('any', '.*');

/**
 * =========================
 * PUBLIC (no auth)
 * =========================
 */
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

/**
 * =========================
 * PROTECTED (auth:sanctum)
 * =========================
 */
Route::middleware('auth:sanctum')->group(function () {

    /**
     * =========================
     * AUTH
     * =========================
     */
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    /**
     * =========================
     * PORTAL ( /portal )
     * Akses: custstaff, viriyastaff, superadmin
     * =========================
     */
    Route::prefix('portal')
        ->middleware(['master_role:custstaff,viriyastaff,superadmin'])
        ->group(function () {

            // Tickets (Portal)
            Route::get('tickets', [PortalTicketController::class, 'index']);
            Route::post('tickets', [PortalTicketController::class, 'store'])->middleware('active_contract');
            Route::get('tickets/{ticket}', [PortalTicketController::class, 'show']);

            // Inventory items (Portal)
            Route::get('inventory-items', [\App\Http\Controllers\Api\PortalInventoryItemController::class, 'index']);

            // KB Reader
            Route::prefix('kb')->group(function () {
                Route::get('articles', [PortalKbController::class, 'index']);
                Route::get('articles/{slug}', [PortalKbController::class, 'show']);
            });

            // Master Products for Portal dropdown (viriyastaff only)
            Route::get('master-products', [MasterProductController::class, 'portalIndex'])
                ->middleware(['master_role:viriyastaff,superadmin']);

            // Announcements (Portal feed/list)
            Route::get('announcements', [PortalAnnouncementController::class, 'index']);

            /**
             * =========================
             * USER ARTICLES (Portal)
             * =========================
             */
            Route::prefix('user-articles')->group(function () {

                // Reviewer queue (HARUS sebelum route {id})
                Route::get('review/queue', [PortalUserArticleReviewController::class, 'queue']);
                Route::post('review/{id}/approve', [PortalUserArticleReviewController::class, 'approve'])->whereNumber('id');
                Route::post('review/{id}/reject', [PortalUserArticleReviewController::class, 'reject'])->whereNumber('id');

                // Author + Reader
                Route::get('', [PortalUserArticleController::class, 'index']);
                Route::post('', [PortalUserArticleController::class, 'store']);

                // ✅ Published maintenance (publisher)
                // Use match PUT+POST to survive proxies/hosting that block PUT
                Route::match(['PUT', 'POST'], '{id}/published', [PortalUserArticleController::class, 'updatePublished'])
                    ->whereNumber('id');

                Route::delete('{id}', [PortalUserArticleController::class, 'destroy'])->whereNumber('id');

                // Detail + update (draft/rejected/review)
                Route::get('{id}', [PortalUserArticleController::class, 'show'])->whereNumber('id');
                Route::put('{id}', [PortalUserArticleController::class, 'update'])->whereNumber('id');

                // Submit review
                Route::post('{id}/submit-review', [PortalUserArticleController::class, 'submitReview'])->whereNumber('id');

                // Publish
                Route::post('{id}/publish', [PortalUserArticleController::class, 'publish'])->whereNumber('id');
            });

            // POPUPS
            Route::get('popups/pending', [PortalPopupController::class, 'pending']);
            Route::post('announcements/{id}/dismiss', [PortalPopupController::class, 'dismissAnnouncement']);
            Route::post('contracts/{contractId}/dismiss', [PortalPopupController::class, 'dismissContractAlert']);
        });

    /**
     * =========================
     * ADMIN ( /admin )
     * Akses: superadmin
     * =========================
     */
    Route::prefix('admin')
        ->middleware(['master_role:superadmin'])
        ->group(function () {

            // Organizations: trash/restore/force
            Route::get('organizations/trash', [OrganizationController::class, 'trash']);
            Route::post('organizations/{id}/restore', [OrganizationController::class, 'restore']);
            Route::delete('organizations/{id}/force', [OrganizationController::class, 'forceDelete']);

            // Organizations CRUD
            Route::apiResource('organizations', OrganizationController::class);
            Route::apiResource('organizations.locations', LocationController::class)->shallow();

            // Branches (sub-unit organisasi) — anak-org, shallow seperti locations
            Route::apiResource('organizations.branches', BranchController::class)->shallow();

            // Products
            Route::apiResource('product-types', ProductTypeController::class);
            Route::apiResource('master-products', MasterProductController::class);

            // Inventory Items
            Route::apiResource('organizations.inventory-items', InventoryItemController::class)->shallow();

            // Team Groups
            Route::apiResource('team-groups', TeamGroupController::class);

            // Team Members by Team Group
            Route::get('team-groups/{teamGroup}/members', [TeamMemberController::class, 'index']);
            Route::post('team-groups/{teamGroup}/members', [TeamMemberController::class, 'store']);
            Route::put('team-groups/{teamGroup}/members/{user}', [TeamMemberController::class, 'update']);
            Route::delete('team-groups/{teamGroup}/members/{user}', [TeamMemberController::class, 'destroy']);
            Route::get('users/all', [TeamMemberController::class, 'users']);

            // Users CRUD
            Route::apiResource('users', AdminUserController::class);

            // Admin: ticket overview per organisasi (dashboard SLA, cross-org)
            Route::get('organizations/{organization}/tickets', [TicketController::class, 'adminIndex']);

            // organisation_attach_teams: kelola tim yang di-attach ke organisasi
            Route::get('organizations/{organization}/teams', [OrganizationTeamController::class, 'index']);
            Route::post('organizations/{organization}/teams', [OrganizationTeamController::class, 'store']);
            Route::delete('organizations/{organization}/teams/{teamGroup}', [OrganizationTeamController::class, 'destroy']);

            // Admin Tickets
            Route::get('tickets', [TicketController::class, 'index']);
            Route::post('tickets', [TicketController::class, 'store']);
            Route::get('tickets/{ticket}', [TicketController::class, 'show']);
            Route::delete('tickets/{ticket}/force', [TicketController::class, 'forceDestroy']);

            // Dropdown role
            Route::get('master-roles', [MasterRoleController::class, 'index']);

            // Contracts
            Route::get('contracts/expiring-soon', [ContractController::class, 'expiringSoon']);
            Route::apiResource('contracts', ContractController::class);

            // Engineers
            Route::get('engineers/candidates', [EngineerController::class, 'candidates']);
            Route::apiResource('engineers', EngineerController::class);

            // Internal setup
            Route::post('team-groups/assign', [TeamManagementController::class, 'assignUserToTeam']);
            Route::post('users/{user}/role', [UserRoleController::class, 'setEngineerRole']);

            // Announcements (Admin CRUD)
            Route::apiResource('announcements', AdminAnnouncementController::class);

            // User Article Reviewer Assignments (Admin)
            Route::apiResource('user-article-reviewers', AdminUserArticleReviewerController::class)
                ->only(['index', 'store', 'update', 'destroy']);

            // User Article Access (Admin)
            Route::get('user-article-access', [AdminUserArticleAccessController::class, 'index']);
            Route::post('user-article-access', [AdminUserArticleAccessController::class, 'upsert']);
        });

    /**
     * =========================
     * ENGINEER MODULE (non-admin)
     * Akses: viriyastaff, superadmin
     * =========================
     */
    Route::middleware(['master_role:viriyastaff,superadmin'])->group(function () {
        Route::patch('tickets/{ticket}/status', [TicketStatusController::class, 'update']);
        Route::patch('tickets/{ticket}/close', [TicketCloseController::class, 'close']);
    });

    /**
     * =========================
     * SHARED: Attachments + Comments
     * Akses: custstaff, viriyastaff, superadmin
     * =========================
     */
    Route::middleware(['master_role:custstaff,viriyastaff,superadmin'])->group(function () {
        Route::get('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'index'])
            ->name('tickets.attachments.index');

        Route::post('tickets/{ticket}/attachments', [TicketAttachmentController::class, 'store'])
            ->name('tickets.attachments.store');

        Route::get('tickets/{ticket}/attachments/{attachment}/download', [TicketAttachmentController::class, 'download'])
            ->name('tickets.attachments.download');

        Route::get('tickets/{ticket}/comments', [TicketCommentController::class, 'index']);
        Route::post('tickets/{ticket}/comments', [TicketCommentController::class, 'store']);
    });
});

/**
 * fallback login route name
 */
Route::get('/login', fn () => response()->json(['message' => 'Unauthorized (Silakan Login)'], 401))
    ->name('login');