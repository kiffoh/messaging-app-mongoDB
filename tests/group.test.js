const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe("Group Deletion", () => {
  let groupId, user1, user2, user3;

  beforeAll(async () => {
    // Find users
    user1 = await prisma.user.findUnique({ where: { username: 'johndoe' } });
    user2 = await prisma.user.findUnique({ where: { username: 'janedoe' } });
    user3 = await prisma.user.findUnique({ where: { username: 'jackdoe' } });

    // Create Group
    const group = await prisma.group.create({
      data: {
        name: 'Test Group',
        directMsg: false,
        members: {
          connect: [{ id: user1.id }, { id: user2.id }, { id: user3.id }],
        },
        admins: {
          connect: { id: user1.id },
        },
      },
    });

    groupId = group.id; // Assign groupId for use in tests
  });

  it("should delete the group and related data successfully", async () => {
    // Check that the group exists before deletion
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        admins: true,
        members: true,
      },
    });
    expect(group).not.toBeNull();
    expect(group.admins.length).toEqual(1);
    expect(group.members.length).toEqual(3);

    // Perform the delete
    await prisma.$transaction(async (prisma) => {
      // Step 1: Delete related message receipts
      await prisma.messageReceipt.deleteMany({
        where: {
          message: {
            groupId: groupId,
          },
        },
      });

      // Step 2: Delete related messages
      await prisma.message.deleteMany({
        where: { groupId: groupId },
      });

      // Step 3: Delete the group itself
      await prisma.group.delete({
        where: { id: groupId },
      });
    });

    // Verify the group was deleted
    const deletedGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });
    expect(deletedGroup).toBeNull();
  });

  it("should disconnect the users from the group", async () => {
    // Verify user1 is no longer an admin or member of the group
    const updatedUser1 = await prisma.user.findUnique({
      where: { id: user1.id },
      include: {
        groups: true,
        adminGroups: true,
      },
    });

    expect(updatedUser1).not.toBeNull();

    // User1 should no longer be a member or admin of the group
    expect(updatedUser1.groups.some(group => group.id === groupId)).toBe(false);
    expect(updatedUser1.adminGroups.some(group => group.id === groupId)).toBe(false);

    // You can repeat similar checks for user2 and user3 if necessary
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});


describe("User Deletion", () => {
    let groupId, DMId, user1, user2, user3;

  beforeAll(async () => {
    // Find users
    user1 = await prisma.user.findUnique({ where: { username: 'johndoe' } });
    user2 = await prisma.user.findUnique({ where: { username: 'janedoe' } });
    
    // Create new User

    user3 = await prisma.user.create({
        data: {
            username: "testUser",
            password: "testuser"
        }
    })

    // Create Group
    const group = await prisma.group.create({
      data: {
        name: 'Test Group',
        directMsg: false,
        members: {
          connect: [{ id: user1.id }, { id: user2.id }, { id: user3.id }],
        },
        admins: {
          connect: { id: user3.id },
        },
      },
    });

    const DM = await prisma.group.create({
        data: {
            directMsg: true,
            members: {
                connect: [{id: user3.id, id: user2.id}]
            }
        }
    })

    groupId = group.id; // Assign groupId for use in tests
    DMId = DM.id
  });

  it("should delete the user successfully", async () => {
    // Check that the group exists before deletion
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        admins: true,
        members: true,
      },
    });
    expect(group).not.toBeNull();
    expect(group.admins.length).toEqual(1);
    expect(group.members.length).toEqual(3);

    // Perform the delete
    await prisma.$transaction(async (prisma) => {
        // Step 1: Delete related message receipts
        await prisma.messageReceipt.deleteMany({
          where: {
            message: {
              authorId: user3.id,
            },
          },
        });

        const deletedUser = await prisma.user.delete({
            where: {
                id: user3.id
            }
        })

        expect(deletedUser).not.toBeNull();
    })

  });
  
  it("should delete the group related data successfully", async () => {
    // Check that the group exists before deletion
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        admins: true,
        members: true,
      },
    });

    expect(group).not.toBeNull();
    expect(group.admins.length).toEqual(0);
    expect(group.members.length).toEqual(2);

    const DM = await prisma.group.findUnique({
        where: { id: DMId},
        include: {
            members: true
        }
    })

    expect(DM).not.toBeNull();
    expect(DM.members.length).toEqual(1);
  });
})
