"use client";

import * as React from "react";
import { Button } from "./ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trash2, X, AlertTriangle, Link2Off } from "lucide-react";
import { CheckCircle, PlusCircle } from "lucide-react";
import { db } from "@/firebaseConfig";
import { ref, onValue, update, get, remove, push } from "firebase/database";
import { useAuth } from "@/auth/authprovider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  field: string;
  medicalId: string;
  type: string;
  email: string;

  subSpecialty?: string[];
  profileDescription?: string;
  profileExperience?: number;
  profileCertification?: string[];
  profileAffiliation?: string[];
  schedule?: {
    clinic: string;
    description: string;
    day: string;
    time: string;
    fee: number;
  }[];

  requestedBy?: string[];
  requestedTo?: string[];
  linkId?: string;
  linkedTo?: string;
  uid?: string;
};

function getEarliestSchedule(user: User) {
  if (!user.schedule || user.schedule.length === 0) return null;
  return user.schedule[0];
}

function getAvatar(id: string, type?: string) {
  if (type?.toLowerCase() === "doctor") {
    return `https://i.pravatar.cc/300?u=doctor-${id}`;
  }
  return `https://i.pravatar.cc/300?u=secretary-${id}`;
}

export function ViewUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = React.useState<User[]>([]);
  const [currentUserDB, setCurrentUserDB] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<keyof User>("firstName");
  const [open, setOpen] = React.useState(false);

  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Unlink state
  const [unlinkTarget, setUnlinkTarget] = React.useState<User | null>(null);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = React.useState(false);
  const [isUnlinking, setIsUnlinking] = React.useState(false);

  const isAdmin = user?.type?.toLowerCase() === "admin";

  React.useEffect(() => {
    if (!user) return;
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const users: User[] = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...(value as any) }))
        : [];
      const currentUser = users.find((u) => u.id === user.uid) || null;
      setCurrentUserDB(currentUser);
      setData(users.filter((u) => u.id !== user.uid));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const doctors = data.filter((u) => u.type?.toLowerCase() === "doctor");
  const secretaries = data.filter((u) => u.type?.toLowerCase() === "secretary");
  const userIsSecretary = user?.type?.toLowerCase() === "secretary";
  const userIsDoctor = user?.type?.toLowerCase() === "doctor";

  const filteredUsers = React.useMemo(() => {
    const term = search.toLowerCase();
    return data.filter((u) => {
      const value = (u[filter] ?? "").toString().toLowerCase();
      return value.includes(term);
    });
  }, [data, search, filter]);

  const doctorsFiltered = filteredUsers.filter(
    (u) => u.type?.toLowerCase() === "doctor",
  );
  const secretariesFiltered = filteredUsers.filter(
    (u) => u.type?.toLowerCase() === "secretary",
  );

  // ----- DELETE USER -----
  const handleDeleteUser = async () => {
    if (!userToDelete || !isAdmin) return;
    setIsDeleting(true);
    try {
      const userRef = ref(db, `users/${userToDelete.id}`);
      const updates: Record<string, any> = {};

      if (userToDelete.type?.toLowerCase() === "secretary") {
        for (const doctor of doctors) {
          if (doctor.linkedTo === userToDelete.id) {
            updates[`users/${doctor.id}/linkId`] = "";
            updates[`users/${doctor.id}/linkedTo`] = "";
          }
        }
      }

      if (userToDelete.type?.toLowerCase() === "doctor") {
        for (const secretary of secretaries) {
          if (secretary.linkedTo === userToDelete.id) {
            updates[`users/${secretary.id}/linkId`] = "";
            updates[`users/${secretary.id}/linkedTo`] = "";
          }
        }
      }

      for (const otherUser of data) {
        if (otherUser.requestedBy?.includes(userToDelete.id)) {
          updates[`users/${otherUser.id}/requestedBy`] =
            otherUser.requestedBy.filter((id) => id !== userToDelete.id);
        }
        if (otherUser.requestedTo?.includes(userToDelete.id)) {
          updates[`users/${otherUser.id}/requestedTo`] =
            otherUser.requestedTo.filter((id) => id !== userToDelete.id);
        }
      }

      if (Object.keys(updates).length > 0) await update(ref(db), updates);
      await remove(userRef);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ----- ADD REQUEST -----
  async function addRequest(u: User): Promise<void> {
    if (!user) return;
    if (currentUserDB?.linkId && currentUserDB.linkId.trim() !== "") {
      alert("You are already linked to a doctor.");
      return;
    }
    if (u.linkId && u.linkId.trim() !== "") {
      alert("This doctor is already linked to a secretary.");
      return;
    }

    const doctorRef = ref(db, `users/${u.id}`);
    const doctorSnapshot = await get(doctorRef);
    const docData = doctorSnapshot.exists() ? doctorSnapshot.val() : {};
    const requestedBy = Array.isArray(docData.requestedBy)
      ? docData.requestedBy
      : [];
    await update(doctorRef, { requestedBy: [...requestedBy, user.uid] });

    const secRef = ref(db, `users/${user.uid}`);
    const secSnapshot = await get(secRef);
    const secData = secSnapshot.exists() ? secSnapshot.val() : {};
    const requestedTo = Array.isArray(secData.requestedTo)
      ? secData.requestedTo
      : [];
    await update(secRef, { requestedTo: [...requestedTo, u.id] });
  }

  // ----- ACCEPT REQUEST -----
  async function acceptRequest(s: User): Promise<void> {
    if (!user) return;
    if (currentUserDB?.linkId && currentUserDB.linkId.trim() !== "") {
      alert("You already have a linked secretary.");
      return;
    }
    if (s.linkId && s.linkId.trim() !== "") {
      alert("This secretary is already linked to a doctor.");
      return;
    }

    const pairRef = push(ref(db, "links"));
    const pairId = pairRef.key!;
    await update(ref(db, `links/${pairId}`), {
      doctorId: user.uid,
      secretaryId: s.id,
      createdAt: Date.now(),
    });

    await update(ref(db, `users/${user.uid}`), {
      linkId: pairId,
      linkedTo: s.id,
      requestedBy: (currentUserDB?.requestedBy || []).filter(
        (id) => id !== s.id,
      ),
    });
    await update(ref(db, `users/${s.id}`), {
      linkId: pairId,
      linkedTo: user.uid,
      requestedTo: (s.requestedTo || []).filter((id) => id !== user.uid),
    });
  }

  // ----- CANCEL REQUEST -----
  async function cancelRequest(s: User): Promise<void> {
    if (!user) return;
    const doctorRef = ref(db, `users/${user.uid}`);
    const doctorSnapshot = await get(doctorRef);
    const doctorData = doctorSnapshot.exists() ? doctorSnapshot.val() : {};
    const requestedBy: string[] = Array.isArray(doctorData.requestedBy)
      ? doctorData.requestedBy
      : [];
    await update(doctorRef, {
      requestedBy: requestedBy.filter((uid) => uid !== s.id),
    });

    const secRef = ref(db, `users/${s.id}`);
    const secSnapshot = await get(secRef);
    const secData = secSnapshot.exists() ? secSnapshot.val() : {};
    const requestedTo: string[] = Array.isArray(secData.requestedTo)
      ? secData.requestedTo
      : [];
    await update(secRef, {
      requestedTo: requestedTo.filter((uid) => uid !== user.uid),
    });
  }

  const handleUnlink = (target: User) => {
    setUnlinkTarget(target);
    setIsUnlinkDialogOpen(true);
  };

  const confirmUnlink = async () => {
    if (!unlinkTarget || !user) return;
    setIsUnlinking(true);
    try {
      const currentUserRef = ref(db, `users/${user.uid}`);
      const targetUserRef = ref(db, `users/${unlinkTarget.id}`);

      const [currentSnap, targetSnap] = await Promise.all([
        get(currentUserRef),
        get(targetUserRef),
      ]);

      const currentData = currentSnap.val();
      const targetData = targetSnap.val();

      const linkId = currentData?.linkId || targetData?.linkId;
      if (!linkId) {
        alert("No active link found.");
        return;
      }

      const updates: Record<string, any> = {};
      updates[`users/${user.uid}/linkId`] = null;
      updates[`users/${user.uid}/linkedTo`] = null;
      updates[`users/${unlinkTarget.id}/linkId`] = null;
      updates[`users/${unlinkTarget.id}/linkedTo`] = null;

      // Remove the link entry
      updates[`links/${linkId}`] = null;

      await update(ref(db), updates);

      setIsUnlinkDialogOpen(false);
      setUnlinkTarget(null);
    } catch (error) {
      console.error("Error unlinking:", error);
      alert("Failed to unlink. Please try again.");
    } finally {
      setIsUnlinking(false);
    }
  };

  const SectionLabel = ({ title }: { title: string }) => (
    <div className="flex items-center w-full my-4">
      <div className="flex-grow border-t border-gray-400" />
      <span className="px-4 text-lg font-semibold text-gray-700 uppercase tracking-wider">
        {title}
      </span>
      <div className="flex-grow border-t border-gray-400" />
    </div>
  );

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 max-w-6xl mx-auto">
      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.firstName}{" "}
              {userToDelete?.lastName}? This action cannot be undone and will
              remove all associated data including:
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-4 rounded-lg space-y-2">
            <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
              <li>User profile and personal information</li>
              <li>All schedules and appointments</li>
              <li>Links with doctors/secretaries</li>
              <li>Pending requests</li>
            </ul>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="!bg-red-300 text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="flex items-center gap-2 !bg-green-700 !text-white"
            >
              {isDeleting ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Dialog */}
      <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Link2Off className="w-5 h-5" />
              Terminate Link
            </DialogTitle>
            <DialogDescription>
              You are about to unlink from{" "}
              <span className="font-semibold">
                {unlinkTarget?.firstName} {unlinkTarget?.lastName}
              </span>
              . This will remove shared access to patients and records between
              you. You can re‑link later by sending a new request.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 p-4 rounded-lg space-y-2">
            <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
              <li>Your linkId will be cleared from both accounts.</li>
              <li>
                Patients and records created by either party will no longer be
                visible to the other.
              </li>
              <li>This action can be reversed by linking again.</li>
            </ul>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsUnlinkDialogOpen(false)}
              disabled={isUnlinking}
              className="!bg-gray-200 !text-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmUnlink}
              disabled={isUnlinking}
              className="flex items-center gap-2 !bg-red-600 hover:!bg-red-700 text-white"
            >
              {isUnlinking ? (
                <>
                  <Spinner className="w-4 h-4" />
                  Unlinking...
                </>
              ) : (
                <>
                  <Link2Off className="w-4 h-4" />
                  Unlink
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            View and Search for Doctors and Secretaries
          </h1>
          <p className="text-gray-500">
            We've found {doctorsFiltered.length + secretariesFiltered.length}{" "}
            Users Available
          </p>
        </div>
        {isAdmin && (
          <div>
            <div className="bg-red-50 px-4 py-2 rounded-lg">
              <p className="text-red-600 text-sm font-semibold">
                Admin Mode: You can delete users
              </p>
            </div>
            <Button
              className="!bg-emerald-500 !text-white"
              onClick={() => navigate(`/add-user`)}
            >
              Add users
            </Button>
          </div>
        )}
      </div>

      {/* SEARCH BAR */}
      <div className="flex gap-4">
        <Input
          placeholder={`Search by ${filter.toLocaleUpperCase()}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="!bg-[#00a896] !text-white">
              Filter <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["firstName", "lastName", "field", "email"].map((col) => (
              <DropdownMenuItem
                key={col}
                onSelect={(e) => {
                  e.preventDefault();
                  setFilter(col as keyof User);
                  setSearch("");
                  setOpen(false);
                }}
              >
                {col}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-8 bg-gray-100 rounded-xl p-1">
            <TabsTrigger
              value="login"
              className="rounded-lg text-sm font-medium transition-all data-[state=active]:!bg-[#00a896] data-[state=active]:!text-white data-[state=inactive]:text-gray-500"
            >
              Doctors
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="rounded-lg text-sm font-medium transition-all data-[state=active]:!bg-[#00a896] data-[state=active]:!text-white data-[state=inactive]:text-gray-500"
            >
              Secretaries
            </TabsTrigger>
          </TabsList>

          {/* ── DOCTORS TAB ── */}
          <TabsContent value="login">
            <div className="mb-6">
              <div className="space-y-6">
                {doctorsFiltered.length > 0 && <SectionLabel title="Doctors" />}
                {doctorsFiltered.map((u) => {
                  const isLinked = currentUserDB?.linkedTo === u.id;
                  const isRequested =
                    currentUserDB?.requestedTo?.includes(u.id) || false;
                  const alreadyLinkedToOther =
                    !!currentUserDB?.linkId && currentUserDB?.linkedTo !== u.id;

                  const canSeeFee = isAdmin || isLinked;
                  const sched = getEarliestSchedule(u);

                  return (
                    <div
                      key={u.id}
                      className="bg-white rounded-2xl shadow-md border p-6 grid grid-cols-1 lg:grid-cols-[320px_1fr_220px] gap-8 items-center relative"
                    >
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-4 right-4 text-red-600 hover:text-red-700 hover:bg-red-50 !bg-white"
                          onClick={() => {
                            setUserToDelete(u);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}

                      {/* LEFT COLUMN */}
                      <div className="flex gap-4 items-center">
                        <Avatar className="w-24 h-24 shrink-0">
                          <AvatarImage src={getAvatar(u.id, u.type)} />
                          <AvatarFallback>DR</AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-2xl font-semibold">
                            Dr. {u.firstName} {u.lastName}
                          </h2>
                          <p className="text-gray-500">{u.field}</p>
                          <p className="text-gray-500">
                            {u.profileExperience ?? 5} yrs experience
                          </p>
                        </div>
                      </div>

                      {/* MIDDLE COLUMN */}
                      <div className="flex items-center justify-center gap-4 h-full">
                        <div className="bg-blue-50 p-4 rounded-xl shrink-0">
                          📱
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">
                            Earliest Available Schedule
                          </p>
                          {sched ? (
                            <>
                              <p className="font-semibold text-lg">
                                {sched.clinic}
                              </p>
                              <p className="text-gray-600">
                                {sched.day}, {sched.time}
                              </p>
                              {canSeeFee ? (
                                <p className="font-semibold mt-2">
                                  Fee: ₱{sched.fee?.toLocaleString()}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 italic mt-2 flex items-center gap-1">
                                  <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500">No schedule yet</p>
                          )}
                        </div>
                      </div>

                      {/* RIGHT COLUMN */}
                      <div className="flex justify-end items-center">
                        {userIsSecretary ? (
                          isLinked ? (
                            <div className="flex items-center gap-3">
                              <Button
                                className="!bg-white text-black underline"
                                onClick={() => navigate(`/profile/${u.id}`)}
                              >
                                VIEW PROFILE
                              </Button>
                              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full font-semibold">
                                <CheckCircle className="w-5 h-5" />
                                LINKED
                              </div>
                              <button
                                onClick={() => handleUnlink(u)}
                                className="flex items-center gap-1 !text-red-500 !bg-white hover:text-red-700 transition-colors"
                                title="Unlink from this doctor"
                              >
                                UNLINK
                              </button>
                            </div>
                          ) : alreadyLinkedToOther ? (
                            <div className="flex items-center gap-3">
                              <Button
                                className="!bg-white text-black underline"
                                onClick={() => navigate(`/profile/${u.id}`)}
                              >
                                VIEW PROFILE
                              </Button>
                              <div className="flex items-center gap-2 bg-gray-200/50 text-gray-600 px-4 py-2 rounded-full font-semibold cursor-not-allowed">
                                <X className="w-5 h-5" />
                                Already Linked
                              </div>
                            </div>
                          ) : isRequested ? (
                            <div className="flex items-center gap-3">
                              <Button
                                className="!bg-white text-black underline"
                                onClick={() => navigate(`/profile/${u.id}`)}
                              >
                                VIEW PROFILE
                              </Button>
                              <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                                <CheckCircle className="w-5 h-5" />
                                REQUEST SENT
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Button
                                className="!bg-white text-black underline"
                                onClick={() => navigate(`/profile/${u.id}`)}
                              >
                                VIEW PROFILE
                              </Button>
                              <button
                                onClick={() => addRequest(u)}
                                className="flex items-center gap-2 !bg-emerald-500 text-white px-4 py-2 rounded-full font-semibold"
                              >
                                <PlusCircle className="w-5 h-5" />
                                Add Doctor
                              </button>
                            </div>
                          )
                        ) : (
                          <Button
                            className="!bg-white text-black underline"
                            onClick={() => navigate(`/profile/${u.id}`)}
                          >
                            VIEW PROFILE
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── SECRETARIES TAB ── */}
          <TabsContent value="signup">
            {secretariesFiltered.length > 0 && (
              <SectionLabel title="Secretaries" />
            )}
            <div className="space-y-6">
              {secretariesFiltered.map((s) => {
                const isLinked = currentUserDB?.linkedTo === s.id;
                const hasRequest =
                  currentUserDB?.requestedBy?.includes(s.id) || false;
                const alreadyLinkedToOther =
                  !!currentUserDB?.linkId && currentUserDB?.linkedTo !== s.id;

                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-2xl shadow-md p-6 flex flex-col lg:flex-row justify-between gap-6 border relative"
                  >
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 text-red-600 hover:text-red-700 hover:bg-red-50 !bg-white"
                        onClick={() => {
                          setUserToDelete(s);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}

                    {/* LEFT */}
                    <div className="flex gap-4 min-w-[280px]">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={getAvatar(s.id, s.type)} />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-semibold">
                          {s.firstName} {s.lastName}
                        </h2>
                        <p className="text-gray-500">Secretary</p>
                        <p className="text-gray-500">{s.email}</p>
                      </div>
                    </div>

                    {/* MIDDLE */}
                    <div className="flex items-center gap-4 min-w-[260px]">
                      <div className="bg-blue-50 p-4 rounded-xl">📩</div>
                      <div>
                        <p className="font-semibold text-gray-700">
                          Contact Info
                        </p>
                        {isAdmin || isLinked ? (
                          <p className="text-gray-600">{s.email}</p>
                        ) : (
                          <p className="text-sm text-gray-400 italic flex items-center gap-1">
                            <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
                          </p>
                        )}
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col justify-center items-end gap-4 min-w-[200px]">
                      <Button
                        className="!bg-white text-black underline"
                        onClick={() => navigate(`/profile/${s.id}`)}
                      >
                        VIEW PROFILE
                      </Button>
                      {userIsDoctor && (
                        <>
                          {isLinked ? (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full font-semibold">
                                <CheckCircle className="w-5 h-5" />
                                LINKED
                              </div>
                              <button
                                onClick={() => handleUnlink(s)}
                                className="flex items-center gap-1 !text-red-500 !bg-white hover:text-red-700 transition-colors"
                                title="Unlink from this secretary"
                              >
                                UNLINK
                              </button>
                            </div>
                          ) : alreadyLinkedToOther ? (
                            <div className="flex items-center gap-2 bg-gray-200/50 text-gray-600 px-4 py-2 rounded-full font-semibold cursor-not-allowed">
                              <X className="w-5 h-5" />
                              Already Linked
                            </div>
                          ) : hasRequest ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRequest(s)}
                                className="flex items-center gap-2 !bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-semibold border border-emerald-200 hover:bg-emerald-100 transition"
                              >
                                <CheckCircle className="w-5 h-5" />
                                Accept
                              </button>
                              <button
                                onClick={() => cancelRequest(s)}
                                className="flex items-center gap-2 !bg-red-50 text-red-600 px-4 py-2 rounded-full font-semibold border border-red-200 hover:bg-red-100 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-full font-semibold">
                              Not Linked
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
